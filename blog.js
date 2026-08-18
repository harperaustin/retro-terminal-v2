(() => {
  const config = window.SITE_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
  const anonKey = String(config.supabaseAnonKey || "");
  const isConfigured = Boolean(supabaseUrl && anonKey);
  const sessionKey = "blogAuthorSession";

  const tabs = document.querySelectorAll(".terminal-tab");
  const terminalView = document.querySelector("#terminalView");
  const blogView = document.querySelector("#blogView");
  const blogPosts = document.querySelector("#blogPosts");
  const blogMessage = document.querySelector("#blogMessage");
  const blogDetail = document.querySelector("#blogDetail");
  const blogBackButton = document.querySelector("#blogBackButton");
  const blogDetailTitle = document.querySelector("#blogDetailTitle");
  const blogDetailDate = document.querySelector("#blogDetailDate");
  const blogDetailContent = document.querySelector("#blogDetailContent");
  const blogDetailActions = document.querySelector("#blogDetailActions");
  const copyPostLinkButton = document.querySelector("#copyPostLinkButton");
  const editPostButton = document.querySelector("#editPostButton");
  const deletePostButton = document.querySelector("#deletePostButton");
  const authorStatus = document.querySelector("#blogAuthorStatus");
  const newPostButton = document.querySelector("#newPostButton");
  const logoutButton = document.querySelector("#logoutButton");
  const authorDialog = document.querySelector("#authorDialog");
  const authorForm = document.querySelector("#authorForm");
  const authorEmail = document.querySelector("#authorEmail");
  const authorPassword = document.querySelector("#authorPassword");
  const authorError = document.querySelector("#authorError");
  const postDialog = document.querySelector("#postDialog");
  const postForm = document.querySelector("#postForm");
  const postId = document.querySelector("#postId");
  const postTitle = document.querySelector("#postTitle");
  const postContent = document.querySelector("#postContent");
  const postError = document.querySelector("#postError");
  const postDialogTitle = document.querySelector("#postDialogTitle");
  const saveDraftButton = document.querySelector("#saveDraftButton");
  const savePostButton = document.querySelector("#savePostButton");
  let session = readSession();
  let isVerifiedAuthor = false;
  let authorCheckPromise;
  let postsLoaded = false;
  let posts = [];
  let selectedPost = null;
  let pendingPostId = null;

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(sessionKey)) || null;
    } catch {
      localStorage.removeItem(sessionKey);
      return null;
    }
  }

  function saveSession(nextSession) {
    session = nextSession;
    if (nextSession) {
      localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(sessionKey);
      isVerifiedAuthor = false;
    }
    renderAuthorState();
  }

  function renderAuthorState() {
    authorStatus.hidden = !isVerifiedAuthor;
    newPostButton.hidden = !isVerifiedAuthor;
    logoutButton.hidden = !isVerifiedAuthor;
    blogDetailActions.hidden = !isVerifiedAuthor || !selectedPost;
  }

  function setView(name) {
    const showBlog = name === "blog";
    terminalView.hidden = showBlog;
    terminalView.classList.toggle("is-active", !showBlog);
    blogView.hidden = !showBlog;
    blogView.classList.toggle("is-active", showBlog);
    tabs.forEach((tab) => {
      const isActive = tab.dataset.view === name;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    if (showBlog && !postsLoaded) {
      loadPosts();
    }
  }

  function setRoute(route) {
    if (window.location.hash === route) {
      applyRoute();
    } else {
      window.location.hash = route;
    }
  }

  function applyRoute() {
    const match = window.location.hash.match(/^#blog(?:\/(\d+))?$/);
    if (!match) {
      pendingPostId = null;
      setView("terminal");
      document.title = "Harper Austin";
      return;
    }
    pendingPostId = match[1] || null;
    setView("blog");
    if (postsLoaded) {
      showRoutedPost();
    }
  }

  function showRoutedPost() {
    if (!pendingPostId) {
      closePost();
      return;
    }
    const post = posts.find(({ id }) => String(id) === pendingPostId);
    if (post) {
      openPost(post);
      return;
    }
    selectedPost = null;
    blogPosts.hidden = true;
    blogDetail.hidden = true;
    blogMessage.hidden = false;
    blogMessage.textContent = "Post not found.";
    renderAuthorState();
    document.title = "Blog — Harper Austin";
  }

  async function api(path, options = {}, authenticated = false, allowRefresh = true) {
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${authenticated ? session?.access_token : anonKey}`,
      ...options.headers,
    };
    const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers });
    if (response.status === 401 && authenticated && allowRefresh && session?.refresh_token) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return api(path, options, authenticated, false);
      }
    }
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.message || body.error_description || body.error || message;
      } catch {
        // Keep the status-based message when the service does not return JSON.
      }
      throw new Error(message);
    }
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function refreshSession() {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (!response.ok) {
        saveSession(null);
        return false;
      }
      saveSession(await response.json());
      return true;
    } catch {
      saveSession(null);
      return false;
    }
  }

  async function verifyAuthorSession() {
    if (!session?.access_token) {
      isVerifiedAuthor = false;
      renderAuthorState();
      return false;
    }
    try {
      const user = await api("/auth/v1/user", {}, true);
      const memberships = await api(
        `/rest/v1/blog_authors?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`,
        {},
        true,
      );
      isVerifiedAuthor = memberships.length === 1;
      if (!isVerifiedAuthor) {
        saveSession(null);
      } else {
        renderAuthorState();
        if (!blogView.hidden && postsLoaded) {
          await loadPosts();
        }
      }
      return isVerifiedAuthor;
    } catch {
      saveSession(null);
      return false;
    }
  }

  function appendInlineContent(element, text) {
    const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let lastIndex = 0;
    for (const match of text.matchAll(linkPattern)) {
      element.append(document.createTextNode(text.slice(lastIndex, match.index)));
      try {
        const url = new URL(match[2], window.location.origin);
        if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
          throw new Error("Unsupported link protocol");
        }
        const link = document.createElement("a");
        link.href = url.href;
        link.textContent = match[1];
        if (url.protocol === "http:" || url.protocol === "https:") {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        element.append(link);
      } catch {
        element.append(document.createTextNode(match[0]));
      }
      lastIndex = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(lastIndex)));
  }

  function appendRichText(container, source) {
    let target = container;
    let codeElement = null;
    source.split(/\r?\n/).forEach((line) => {
      const codeFenceMatch = line.match(/^```([\w-]*)\s*$/);
      if (codeFenceMatch) {
        if (codeElement) {
          codeElement = null;
        } else {
          const pre = document.createElement("pre");
          codeElement = document.createElement("code");
          if (codeFenceMatch[1]) {
            pre.dataset.language = codeFenceMatch[1];
          }
          pre.append(codeElement);
          target.append(pre);
        }
        return;
      }
      if (codeElement) {
        codeElement.textContent += `${line}\n`;
        return;
      }
      const expandableMatch = line.match(/^:::\s*(?:details|expandable)\s+(.+)$/i);
      if (expandableMatch) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const content = document.createElement("div");
        content.className = "blog-expandable-content";
        summary.textContent = expandableMatch[1];
        details.append(summary, content);
        container.append(details);
        target = content;
        return;
      }
      if (/^:::\s*$/.test(line)) {
        target = container;
        return;
      }
      if (!line.trim()) {
        return;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      const element = document.createElement(
        headingMatch ? `h${Math.min(headingMatch[1].length + 1, 4)}` : "p",
      );
      appendInlineContent(element, headingMatch ? headingMatch[2] : line);
      target.append(element);
    });
  }

  function openPost(post) {
    selectedPost = post;
    blogPosts.hidden = true;
    blogMessage.hidden = true;
    blogDetail.hidden = false;
    blogDetailTitle.textContent = post.title;
    if (post.is_draft) {
      blogDetailDate.removeAttribute("datetime");
      blogDetailDate.textContent = "Draft";
    } else {
      blogDetailDate.dateTime = post.published_at;
      blogDetailDate.textContent = formatPostDate(post.published_at);
    }
    blogDetailContent.replaceChildren();
    appendRichText(blogDetailContent, post.content);
    renderAuthorState();
    document.title = `${post.title} — Harper Austin`;
    blogView.scrollTop = 0;
  }

  function closePost() {
    selectedPost = null;
    blogDetail.hidden = true;
    blogPosts.hidden = false;
    renderAuthorState();
    document.title = "Blog — Harper Austin";
    blogView.scrollTop = 0;
  }

  function renderPosts(nextPosts) {
    posts = nextPosts;
    blogPosts.replaceChildren();
    blogPosts.hidden = false;
    blogDetail.hidden = true;
    selectedPost = null;
    if (nextPosts.length === 0) {
      blogMessage.textContent = "No posts yet.";
      blogMessage.hidden = false;
      return;
    }
    blogMessage.hidden = true;
    nextPosts.forEach((post) => {
      const button = document.createElement("button");
      button.className = "blog-post-link";
      button.type = "button";
      const status = document.createElement(post.is_draft ? "span" : "time");
      if (post.is_draft) {
        status.className = "blog-draft-label";
        status.textContent = "Draft";
      } else {
        status.dateTime = post.published_at;
        status.textContent = formatPostDate(post.published_at);
      }
      const title = document.createElement("h2");
      title.textContent = post.title;
      button.append(title, status);
      button.addEventListener("click", () => setRoute(`#blog/${post.id}`));
      blogPosts.append(button);
    });
    renderAuthorState();
  }

  function formatPostDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  }

  async function loadPosts() {
    postsLoaded = true;
    if (!isConfigured) {
      blogMessage.textContent = "Blog setup is not complete yet.";
      return;
    }
    blogMessage.hidden = false;
    blogMessage.textContent = "Loading posts…";
    try {
      const posts = await api(
        "/rest/v1/blog_posts?select=id,title,content,published_at,is_draft&order=published_at.desc",
        {},
        isVerifiedAuthor,
      );
      renderPosts(posts);
      showRoutedPost();
    } catch (error) {
      blogMessage.textContent = `Could not load posts: ${error.message}`;
    }
  }

  async function openAuthorLogin() {
    if (!isConfigured) {
      window.dispatchEvent(
        new CustomEvent("terminal:message", {
          detail: { text: "Author login is not configured yet.", error: true },
        }),
      );
      return;
    }
    await authorCheckPromise;
    if (isVerifiedAuthor) {
      setView("blog");
      return;
    }
    authorError.textContent = "";
    authorDialog.showModal();
    authorEmail.focus();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.dataset.view === "blog") {
        setRoute("#blog");
      } else {
        window.history.pushState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        applyRoute();
      }
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`#${button.dataset.closeDialog}`).close();
    });
  });

  authorDialog.addEventListener("click", (event) => {
    if (event.target === authorDialog) {
      authorDialog.close();
    }
  });

  postDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
  });

  authorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authorError.textContent = "";
    const submitButton = authorForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email: authorEmail.value, password: authorPassword.value }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error_description || body.msg || "Login failed");
      }
      isVerifiedAuthor = false;
      saveSession(body);
      authorCheckPromise = verifyAuthorSession();
      if (!(await authorCheckPromise)) {
        throw new Error("This account is not authorized to publish.");
      }
      authorPassword.value = "";
      authorDialog.close();
      await loadPosts();
      setView("blog");
    } catch (error) {
      authorError.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  newPostButton.addEventListener("click", () => {
    if (!isVerifiedAuthor) {
      return;
    }
    postForm.reset();
    postId.value = "";
    postError.textContent = "";
    postDialogTitle.textContent = "New post";
    saveDraftButton.textContent = "Save as draft";
    savePostButton.textContent = "Publish post";
    postDialog.showModal();
    postTitle.focus();
  });

  blogBackButton.addEventListener("click", () => setRoute("#blog"));

  copyPostLinkButton.addEventListener("click", async () => {
    if (!selectedPost) {
      return;
    }
    const url = new URL(window.location.href);
    url.hash = `blog/${selectedPost.id}`;
    try {
      await navigator.clipboard.writeText(url.href);
      copyPostLinkButton.textContent = "Copied";
      window.setTimeout(() => {
        copyPostLinkButton.textContent = "Copy link";
      }, 1600);
    } catch {
      copyPostLinkButton.textContent = "Copy failed";
    }
  });

  editPostButton.addEventListener("click", () => {
    if (!isVerifiedAuthor || !selectedPost) {
      return;
    }
    postId.value = selectedPost.id;
    postTitle.value = selectedPost.title;
    postContent.value = selectedPost.content;
    postError.textContent = "";
    postDialogTitle.textContent = "Edit post";
    saveDraftButton.textContent = selectedPost.is_draft ? "Save draft" : "Move to drafts";
    savePostButton.textContent = selectedPost.is_draft ? "Publish post" : "Save changes";
    postDialog.showModal();
    postTitle.focus();
  });

  deletePostButton.addEventListener("click", async () => {
    if (
      !isVerifiedAuthor
      || !selectedPost
      || !window.confirm(`Delete “${selectedPost.title}”? This cannot be undone.`)
    ) {
      return;
    }
    deletePostButton.disabled = true;
    try {
      const deletedPosts = await api(
        `/rest/v1/blog_posts?id=eq.${encodeURIComponent(selectedPost.id)}`,
        { method: "DELETE", headers: { Prefer: "return=representation" } },
        true,
      );
      if (!Array.isArray(deletedPosts) || deletedPosts.length !== 1) {
        throw new Error("Supabase did not authorize the deletion.");
      }
      window.history.replaceState(null, "", "#blog");
      pendingPostId = null;
      await loadPosts();
    } catch (error) {
      window.alert(`Could not delete post: ${error.message}`);
    } finally {
      deletePostButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-format]").forEach((button) => {
    button.addEventListener("click", () => {
      const start = postContent.selectionStart;
      const end = postContent.selectionEnd;
      const selectedText = postContent.value.slice(start, end);
      const templates = {
        heading: `# ${selectedText || "Section heading"}\n`,
        subheading: `## ${selectedText || "Subheading"}\n`,
        code: `\`\`\`js\n${selectedText || "const example = true;"}\n\`\`\`\n`,
        link: `[${selectedText || "short name"}](https://example.com)`,
        expandable: `::: details Click to expand\n${selectedText || "Write hidden content here."}\n:::\n`,
      };
      const template = templates[button.dataset.format];
      postContent.setRangeText(template, start, end, "end");
      postContent.focus();
    });
  });

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isVerifiedAuthor) {
      postError.textContent = "Your author session is not authorized.";
      return;
    }
    postError.textContent = "";
    const isDraft = event.submitter?.value === "draft";
    const submitButtons = postForm.querySelectorAll('[type="submit"]');
    submitButtons.forEach((button) => {
      button.disabled = true;
    });
    try {
      const editingPostId = postId.value;
      const editingPost = posts.find(({ id }) => String(id) === editingPostId);
      const postValues = {
        title: postTitle.value.trim(),
        content: postContent.value.trim(),
        is_draft: isDraft,
      };
      if (!isDraft && (!editingPost || editingPost.is_draft)) {
        postValues.published_at = new Date().toISOString();
      }
      const savedPosts = await api(
        editingPostId
          ? `/rest/v1/blog_posts?id=eq.${encodeURIComponent(editingPostId)}`
          : "/rest/v1/blog_posts",
        {
          method: editingPostId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(postValues),
        },
        true,
      );
      if (!Array.isArray(savedPosts) || savedPosts.length !== 1) {
        throw new Error("Supabase did not authorize this change.");
      }
      postDialog.close();
      await loadPosts();
      if (editingPostId) {
        const updatedPost = posts.find(({ id }) => String(id) === editingPostId);
        if (updatedPost) {
          openPost(updatedPost);
        }
      }
    } catch (error) {
      postError.textContent = error.message;
    } finally {
      submitButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  });

  logoutButton.addEventListener("click", async () => {
    if (session?.access_token) {
      try {
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
        });
      } finally {
        saveSession(null);
        await loadPosts();
      }
    }
  });

  window.addEventListener("terminal:author-login", () => {
    openAuthorLogin();
  });
  window.addEventListener("hashchange", applyRoute);
  renderAuthorState();
  authorCheckPromise = verifyAuthorSession();
  applyRoute();
})();
