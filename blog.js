(() => {
  const config = window.SITE_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
  const anonKey = String(config.supabaseAnonKey || "");
  const isConfigured = Boolean(supabaseUrl && anonKey);
  const sessionKey = "blogAuthorSession";

  const tabs = document.querySelectorAll(".terminal-tab");
  const terminalView = document.querySelector("#terminalView");
  const blogView = document.querySelector("#blogView");
  const musicView = document.querySelector("#musicView");
  const photographyView = document.querySelector("#photographyView");
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
  const musicReleases = document.querySelector("#musicReleases");
  const musicMessage = document.querySelector("#musicMessage");
  const musicAuthorStatus = document.querySelector("#musicAuthorStatus");
  const musicLogoutButton = document.querySelector("#musicLogoutButton");
  const newReleaseButton = document.querySelector("#newReleaseButton");
  const releaseDialog = document.querySelector("#releaseDialog");
  const releaseForm = document.querySelector("#releaseForm");
  const releaseDialogTitle = document.querySelector("#releaseDialogTitle");
  const releaseId = document.querySelector("#releaseId");
  const releaseTitle = document.querySelector("#releaseTitle");
  const releaseType = document.querySelector("#releaseType");
  const releaseDate = document.querySelector("#releaseDate");
  const releaseSpotifyUrl = document.querySelector("#releaseSpotifyUrl");
  const releaseAppleMusicUrl = document.querySelector("#releaseAppleMusicUrl");
  const releaseBandcampUrl = document.querySelector("#releaseBandcampUrl");
  const releaseSoundcloudUrl = document.querySelector("#releaseSoundcloudUrl");
  const releaseCoverUrl = document.querySelector("#releaseCoverUrl");
  const releaseCoverFile = document.querySelector("#releaseCoverFile");
  const importSpotifyButton = document.querySelector("#importSpotifyButton");
  const deleteReleaseButton = document.querySelector("#deleteReleaseButton");
  const releaseError = document.querySelector("#releaseError");
  const photoGallery = document.querySelector("#photoGallery");
  const photoCarouselStatus = document.querySelector("#photoCarouselStatus");
  const photoMessage = document.querySelector("#photoMessage");
  const photoAuthorStatus = document.querySelector("#photoAuthorStatus");
  const photoLogoutButton = document.querySelector("#photoLogoutButton");
  const newPhotoButton = document.querySelector("#newPhotoButton");
  const shufflePhotosButton = document.querySelector("#shufflePhotosButton");
  const photoDialog = document.querySelector("#photoDialog");
  const photoForm = document.querySelector("#photoForm");
  const photoDialogTitle = document.querySelector("#photoDialogTitle");
  const photoId = document.querySelector("#photoId");
  const photoFile = document.querySelector("#photoFile");
  const photoFileLabelText = document.querySelector("#photoFileLabelText");
  const photoAltText = document.querySelector("#photoAltText");
  const photoCaption = document.querySelector("#photoCaption");
  const photoTakenAt = document.querySelector("#photoTakenAt");
  const photoError = document.querySelector("#photoError");
  const deletePhotoButton = document.querySelector("#deletePhotoButton");
  const photoLightbox = document.querySelector("#photoLightbox");
  const photoLightboxImage = document.querySelector("#photoLightboxImage");
  const photoLightboxCaption = document.querySelector("#photoLightboxCaption");
  let session = readSession();
  let isVerifiedAuthor = false;
  let authorCheckPromise;
  let postsLoaded = false;
  let posts = [];
  let selectedPost = null;
  let pendingPostId = null;
  let releasesLoaded = false;
  let releases = [];
  let photosLoaded = false;
  let photos = [];

  function setStatus(element, message, isLoading = false) {
    element.classList.toggle("is-loading", isLoading);
    element.textContent = message;
    window.dispatchEvent(
      new CustomEvent("redesign:loading-status", {
        detail: { element, isLoading },
      }),
    );
  }

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
    musicAuthorStatus.hidden = !isVerifiedAuthor;
    musicLogoutButton.hidden = !isVerifiedAuthor;
    newReleaseButton.hidden = !isVerifiedAuthor;
    renderReleases(releases);
    photoAuthorStatus.hidden = !isVerifiedAuthor;
    photoLogoutButton.hidden = !isVerifiedAuthor;
    newPhotoButton.hidden = !isVerifiedAuthor;
    renderPhotos(photos);
  }

  function setView(name) {
    const showBlog = name === "blog";
    const showMusic = name === "music";
    const showPhotography = name === "photography";
    terminalView.hidden = showBlog || showMusic || showPhotography;
    terminalView.classList.toggle("is-active", name === "terminal");
    blogView.hidden = !showBlog;
    blogView.classList.toggle("is-active", showBlog);
    musicView.hidden = !showMusic;
    musicView.classList.toggle("is-active", showMusic);
    photographyView.hidden = !showPhotography;
    photographyView.classList.toggle("is-active", showPhotography);
    tabs.forEach((tab) => {
      const isActive = tab.dataset.view === name;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    if (showBlog && !postsLoaded) {
      loadPosts();
    }
    if (showMusic && !releasesLoaded) {
      loadReleases();
    }
    if (showPhotography && !photosLoaded) {
      loadPhotos();
    } else if (showPhotography) {
      renderPhotos(photos);
    }
    if (name === "terminal") {
      document.title = "Harper Austin";
      window.dispatchEvent(new CustomEvent("redesign:home-visible"));
    } else if (name === "music") {
      document.title = "Music — Harper Austin";
    } else if (name === "photography") {
      document.title = "Photography — Harper Austin";
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
    if (window.location.hash === "#music") {
      pendingPostId = null;
      setView("music");
      document.title = "Music — Harper Austin";
      return;
    }
    if (window.location.hash === "#photography") {
      pendingPostId = null;
      setView("photography");
      return;
    }
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
    setStatus(blogMessage, "Post not found.");
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
        if (!musicView.hidden && releasesLoaded) {
          await loadReleases();
        }
        if (!photographyView.hidden && photosLoaded) {
          await loadPhotos();
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

  function parseTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function isTableDivider(line) {
    const cells = parseTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function appendTable(container, lines, startIndex) {
    const tableWrapper = document.createElement("div");
    const table = document.createElement("table");
    const tableHead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = parseTableRow(lines[startIndex]);

    headers.forEach((header) => {
      const cell = document.createElement("th");
      appendInlineContent(cell, header);
      headerRow.append(cell);
    });
    tableHead.append(headerRow);
    table.append(tableHead);

    const tableBody = document.createElement("tbody");
    let nextIndex = startIndex + 2;
    while (nextIndex < lines.length && lines[nextIndex].includes("|") && lines[nextIndex].trim()) {
      const row = document.createElement("tr");
      const cells = parseTableRow(lines[nextIndex]);
      headers.forEach((_, cellIndex) => {
        const cell = document.createElement("td");
        appendInlineContent(cell, cells[cellIndex] || "");
        row.append(cell);
      });
      tableBody.append(row);
      nextIndex += 1;
    }
    table.append(tableBody);
    tableWrapper.className = "blog-table-wrapper";
    tableWrapper.append(table);
    container.append(tableWrapper);
    return nextIndex - 1;
  }

  function appendRichText(container, source) {
    let target = container;
    let codeElement = null;
    const lines = source.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
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
        continue;
      }
      if (codeElement) {
        codeElement.textContent += `${line}\n`;
        continue;
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
        continue;
      }
      if (/^:::\s*$/.test(line)) {
        target = container;
        continue;
      }
      if (!line.trim()) {
        continue;
      }
      if (
        line.includes("|")
        && lineIndex + 1 < lines.length
        && isTableDivider(lines[lineIndex + 1])
      ) {
        lineIndex = appendTable(target, lines, lineIndex);
        continue;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      const element = document.createElement(
        headingMatch ? `h${Math.min(headingMatch[1].length + 1, 4)}` : "p",
      );
      appendInlineContent(element, headingMatch ? headingMatch[2] : line);
      target.append(element);
    }
  }

  function openPost(post) {
    selectedPost = post;
    blogPosts.hidden = true;
    setStatus(blogMessage, "");
    setStatus(blogMessage, "");
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
      setStatus(blogMessage, "No posts yet.");
      blogMessage.hidden = false;
      return;
    }
    setStatus(blogMessage, "");
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
      setStatus(blogMessage, "Blog setup is not complete yet.");
      return;
    }
    blogMessage.hidden = false;
    setStatus(blogMessage, "loading...", true);
    try {
      const posts = await api(
        "/rest/v1/blog_posts?select=id,title,content,published_at,is_draft&order=published_at.desc",
        {},
        isVerifiedAuthor,
      );
      renderPosts(posts);
      showRoutedPost();
    } catch (error) {
      setStatus(blogMessage, `Could not load posts: ${error.message}`);
    }
  }

  function normalizeHttpUrl(value, label) {
    if (!value) {
      return null;
    }
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${label} must be a valid URL.`);
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(`${label} must use http or https.`);
    }
    return url.href;
  }

  function createPlatformLink(label, value) {
    let url;
    try {
      url = normalizeHttpUrl(value, label);
    } catch {
      return null;
    }
    if (!url) {
      return null;
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    return link;
  }

  function openReleaseEditor(release = null) {
    if (!isVerifiedAuthor) {
      return;
    }
    releaseForm.reset();
    releaseError.textContent = "";
    releaseId.value = release?.id || "";
    releaseTitle.value = release?.title || "";
    releaseType.value = release?.release_type || "album";
    releaseDate.value = release?.release_date || "";
    releaseSpotifyUrl.value = release?.spotify_url || "";
    releaseAppleMusicUrl.value = release?.apple_music_url || "";
    releaseBandcampUrl.value = release?.bandcamp_url || "";
    releaseSoundcloudUrl.value = release?.soundcloud_url || "";
    releaseCoverUrl.value = release?.cover_url || "";
    releaseDialogTitle.textContent = release ? "Edit release" : "Add release";
    deleteReleaseButton.hidden = !release;
    releaseDialog.showModal();
    (release ? releaseTitle : releaseSpotifyUrl).focus();
  }

  function renderReleases(nextReleases) {
    if (!releasesLoaded) {
      return;
    }
    releases = nextReleases;
    musicReleases.replaceChildren();
    if (releases.length === 0) {
      setStatus(musicMessage, "No releases yet.");
      musicMessage.hidden = false;
      return;
    }
    setStatus(musicMessage, "");
    musicMessage.hidden = true;
    releases.forEach((release) => {
      const article = document.createElement("article");
      article.className = "music-release";

      let coverUrl = null;
      try {
        coverUrl = normalizeHttpUrl(release.cover_url, "Cover image URL");
      } catch {
        // Render the placeholder when stored artwork is no longer a valid URL.
      }
      if (coverUrl) {
        const image = document.createElement("img");
        image.src = coverUrl;
        image.alt = `${release.title} cover artwork`;
        image.loading = "lazy";
        article.append(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "music-cover-placeholder";
        placeholder.textContent = release.title.slice(0, 1);
        article.append(placeholder);
      }

      const title = document.createElement("h2");
      title.textContent = release.title;
      const metadata = document.createElement("p");
      const year = release.release_date ? new Date(`${release.release_date}T00:00:00`).getFullYear() : "";
      metadata.textContent = [release.release_type, year].filter(Boolean).join(" · ");

      const links = document.createElement("div");
      links.className = "music-platforms";
      [
        createPlatformLink("Spotify", release.spotify_url),
        createPlatformLink("Apple Music", release.apple_music_url),
        createPlatformLink("Bandcamp", release.bandcamp_url),
        createPlatformLink("SoundCloud", release.soundcloud_url),
      ].filter(Boolean).forEach((link) => links.append(link));

      article.append(title, metadata, links);
      if (isVerifiedAuthor) {
        const editButton = document.createElement("button");
        editButton.className = "music-edit-button";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => openReleaseEditor(release));
        article.append(editButton);
      }
      musicReleases.append(article);
    });
  }

  async function loadReleases() {
    releasesLoaded = true;
    if (!isConfigured) {
      setStatus(musicMessage, "Music setup is not complete yet.");
      return;
    }
    musicMessage.hidden = false;
    setStatus(musicMessage, "loading...", true);
    try {
      const nextReleases = await api(
        "/rest/v1/music_releases?select=*&order=release_date.desc.nullslast,created_at.desc",
        {},
        isVerifiedAuthor,
      );
      renderReleases(nextReleases);
    } catch (error) {
      setStatus(musicMessage, `Could not load releases: ${error.message}`);
    }
  }

  async function uploadImage(file, bucket, label, maximumSizeMb) {
    if (file.size > maximumSizeMb * 1024 * 1024) {
      throw new Error(`${label} must be smaller than ${maximumSizeMb} MB.`);
    }
    const extensionByType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = extensionByType[file.type];
    if (!extension) {
      throw new Error(`${label} must be a JPG, PNG, or WebP image.`);
    }
    const objectPath = `${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Could not upload ${label.toLowerCase()}.`);
    }
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  function uploadCover(file) {
    return uploadImage(file, "music-covers", "Cover artwork", 8);
  }

  function shuffled(items) {
    const nextItems = [...items];
    for (let index = nextItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
    }
    return nextItems;
  }

  function openPhotoLightbox(photo) {
    photoLightboxImage.src = photo.image_url;
    photoLightboxImage.alt = photo.alt_text || "";
    photoLightboxCaption.textContent = photo.caption || "";
    photoLightboxCaption.hidden = !photo.caption;
    photoLightbox.showModal();
  }

  function openPhotoEditor(photo = null) {
    if (!isVerifiedAuthor) {
      return;
    }
    photoForm.reset();
    photoError.textContent = "";
    photoId.value = photo?.id || "";
    photoAltText.value = photo?.alt_text || "";
    photoCaption.value = photo?.caption || "";
    photoTakenAt.value = photo?.taken_at || "";
    photoFile.required = !photo;
    photoFileLabelText.textContent = photo
      ? "Replace photograph (optional)"
      : "Photographs";
    photoDialogTitle.textContent = photo ? "Edit photograph" : "Upload photograph";
    deletePhotoButton.hidden = !photo;
    photoDialog.showModal();
    (photo ? photoAltText : photoFile).focus();
  }

  function sizePhotoCard(card, image) {
    if (!image.naturalWidth || !image.naturalHeight || window.innerWidth <= 560) {
      card.style.removeProperty("grid-row-end");
      return;
    }
    const galleryStyles = window.getComputedStyle(photoGallery);
    const rowHeight = Number.parseFloat(galleryStyles.gridAutoRows);
    const rowGap = Number.parseFloat(galleryStyles.rowGap);
    const imageHeight = card.clientWidth * (image.naturalHeight / image.naturalWidth);
    const rowSpan = Math.ceil((imageHeight + rowGap) / (rowHeight + rowGap));
    card.style.gridRowEnd = `span ${rowSpan}`;
  }

  function arrangePhotoSlides() {
    photoGallery.querySelectorAll(".photo-slide").forEach((slide) => {
      slide.replaceWith(...slide.children);
    });
    const cards = Array.from(photoGallery.querySelectorAll(":scope > .photo-card"));
    if (!cards.length || cards.some((card) => !card.dataset.orientation)) {
      return;
    }

    const slides = [];
    let pendingLandscape = null;
    cards.forEach((card) => {
      if (card.dataset.orientation === "portrait") {
        const slide = document.createElement("div");
        slide.className = "photo-slide photo-slide-portrait";
        slide.append(card);
        slides.push(slide);
      } else if (pendingLandscape) {
        const slide = document.createElement("div");
        slide.className = "photo-slide photo-slide-landscape";
        slide.append(pendingLandscape, card);
        slides.push(slide);
        pendingLandscape = null;
      } else {
        pendingLandscape = card;
      }
    });
    if (pendingLandscape) {
      const slide = document.createElement("div");
      slide.className = "photo-slide photo-slide-landscape";
      slide.append(pendingLandscape);
      slides.push(slide);
    }
    photoGallery.replaceChildren(...slides);
    photoGallery.scrollLeft = 0;
    updatePhotoCarouselStatus();
  }

  function updatePhotoCarouselStatus() {
    const slides = Array.from(photoGallery.querySelectorAll(".photo-slide"));
    const showStatus = window.innerWidth <= 560 && slides.length > 1;
    photoCarouselStatus.hidden = !showStatus;
    if (!showStatus) {
      return;
    }
    const firstOffset = slides[0].offsetLeft;
    const activeIndex = slides.reduce((closestIndex, slide, index) => {
      const currentDistance = Math.abs(
        slides[closestIndex].offsetLeft - firstOffset - photoGallery.scrollLeft,
      );
      const nextDistance = Math.abs(slide.offsetLeft - firstOffset - photoGallery.scrollLeft);
      return nextDistance < currentDistance ? index : closestIndex;
    }, 0);
    photoCarouselStatus.textContent = `${activeIndex + 1} / ${slides.length}`;
  }

  function renderPhotos(nextPhotos) {
    if (!photosLoaded) {
      return;
    }
    photos = nextPhotos;
    photoGallery.replaceChildren();
    shufflePhotosButton.hidden = photos.length < 2;
    if (photos.length === 0) {
      setStatus(photoMessage, "No photographs yet.");
      photoMessage.hidden = false;
      return;
    }
    setStatus(photoMessage, "");
    photoMessage.hidden = true;
    photoGallery.scrollLeft = 0;
    const layouts = ["feature", "standard", "tall", "wide", "standard", "tall", "wide"];
    shuffled(photos).forEach((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = "photo-card";
      figure.dataset.layout = layouts[index % layouts.length];
      figure.style.setProperty("--photo-delay", `${Math.min(index * 55, 440)}ms`);

      const previewButton = document.createElement("button");
      previewButton.className = "photo-card-button";
      previewButton.type = "button";
      previewButton.setAttribute(
        "aria-label",
        `View ${photo.alt_text || photo.caption || "photograph"}`,
      );
      previewButton.addEventListener("click", () => openPhotoLightbox(photo));

      const image = document.createElement("img");
      image.alt = photo.alt_text || "";
      image.loading = window.innerWidth <= 560 ? "eager" : "lazy";
      image.addEventListener("load", () => {
        figure.dataset.orientation = image.naturalHeight > image.naturalWidth
          ? "portrait"
          : "landscape";
        sizePhotoCard(figure, image);
        arrangePhotoSlides();
      });
      image.addEventListener("error", () => {
        figure.dataset.orientation = "landscape";
        arrangePhotoSlides();
      });
      image.src = photo.image_url;
      previewButton.append(image);
      figure.append(previewButton);

      if (photo.caption) {
        const caption = document.createElement("figcaption");
        caption.className = "photo-caption";
        caption.textContent = photo.caption;
        figure.append(caption);
      }
      if (isVerifiedAuthor) {
        const editButton = document.createElement("button");
        editButton.className = "photo-edit-button";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => openPhotoEditor(photo));
        figure.append(editButton);
      }
      photoGallery.append(figure);
      if (image.complete) {
        figure.dataset.orientation = image.naturalHeight > image.naturalWidth
          ? "portrait"
          : "landscape";
        sizePhotoCard(figure, image);
      }
    });
    window.requestAnimationFrame(arrangePhotoSlides);
  }

  function preloadPhotos(nextPhotos) {
    return Promise.all(
      nextPhotos.map((photo) => new Promise((resolve) => {
        const image = new Image();
        image.addEventListener("load", async () => {
          try {
            await image.decode();
          } catch {
            // The load event still confirms the image is available to render.
          }
          resolve();
        }, { once: true });
        image.addEventListener("error", resolve, { once: true });
        image.src = photo.image_url;
      })),
    );
  }

  async function loadPhotos() {
    photosLoaded = true;
    if (!isConfigured) {
      setStatus(photoMessage, "Photography setup is not complete yet.");
      return;
    }
    photoMessage.hidden = false;
    setStatus(photoMessage, "loading...", true);
    try {
      const nextPhotos = await api(
        "/rest/v1/photography_images?select=*&order=created_at.desc",
        {},
        isVerifiedAuthor,
      );
      await preloadPhotos(nextPhotos);
      renderPhotos(nextPhotos);
    } catch (error) {
      setStatus(photoMessage, `Could not load photographs: ${error.message}`);
    }
  }

  let photoResizeTimer;
  let photoScrollFrame;
  photoGallery.addEventListener("scroll", () => {
    window.cancelAnimationFrame(photoScrollFrame);
    photoScrollFrame = window.requestAnimationFrame(updatePhotoCarouselStatus);
  });
  window.addEventListener("resize", () => {
    window.clearTimeout(photoResizeTimer);
    photoResizeTimer = window.setTimeout(() => {
      photoGallery.querySelectorAll(".photo-card").forEach((card) => {
        sizePhotoCard(card, card.querySelector("img"));
      });
      updatePhotoCarouselStatus();
    }, 120);
  });

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
      return;
    }
    authorError.textContent = "";
    authorDialog.showModal();
    authorEmail.focus();
  }

  let mobileNavigationPending = false;

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      const navigate = () => {
        if (tab.dataset.view === "blog") {
          setRoute("#blog");
        } else if (tab.dataset.view === "music") {
          setRoute("#music");
        } else if (tab.dataset.view === "photography") {
          setRoute("#photography");
        } else {
          window.history.pushState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
          applyRoute();
        }
      };
      const shouldAnimateFirst = (
        tab.classList.contains("minimal-link")
        && window.matchMedia("(hover: none), (pointer: coarse)").matches
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
      if (shouldAnimateFirst) {
        event.preventDefault();
        if (mobileNavigationPending) {
          return;
        }
        mobileNavigationPending = true;
        tab.dispatchEvent(new CustomEvent("redesign:ripple"));
        window.setTimeout(() => {
          mobileNavigationPending = false;
          navigate();
        }, 560);
        return;
      }
      navigate();
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
      if (releasesLoaded) {
        await loadReleases();
      }
      if (photosLoaded) {
        await loadPhotos();
      }
      applyRoute();
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

  newReleaseButton.addEventListener("click", () => openReleaseEditor());
  newPhotoButton.addEventListener("click", () => openPhotoEditor());
  shufflePhotosButton.addEventListener("click", () => renderPhotos(photos));

  photoFile.addEventListener("change", () => {
    if (photoId.value) {
      photoFileLabelText.textContent = photoFile.files.length
        ? "Replacement photograph selected"
        : "Replace photograph (optional)";
      return;
    }
    const count = photoFile.files.length;
    photoFileLabelText.textContent = count
      ? `${count} photograph${count === 1 ? "" : "s"} selected`
      : "Photographs";
  });

  photoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isVerifiedAuthor) {
      photoError.textContent = "Your author session is not authorized.";
      return;
    }
    photoError.textContent = "";
    const submitButton = photoForm.querySelector('[type="submit"]');
    const originalSubmitText = submitButton.textContent;
    submitButton.disabled = true;
    try {
      const editingPhotoId = photoId.value;
      const editingPhoto = photos.find(({ id }) => String(id) === editingPhotoId);
      const files = Array.from(photoFile.files);
      if (editingPhotoId && !editingPhoto) {
        throw new Error("This photograph is no longer available to edit.");
      }
      if (editingPhotoId && files.length > 1) {
        throw new Error("Choose at most one replacement when editing a photograph.");
      }
      if (!editingPhotoId && files.length === 0) {
        throw new Error("Choose one or more photographs to upload.");
      }
      const imageUrls = [];
      if (files.length) {
        for (let index = 0; index < files.length; index += 1) {
          submitButton.textContent = `Uploading ${index + 1} of ${files.length}…`;
          imageUrls.push(await uploadImage(files[index], "photography", "Photograph", 12));
        }
      } else {
        imageUrls.push(editingPhoto.image_url);
      }
      const sharedValues = {
        alt_text: photoAltText.value.trim() || null,
        caption: photoCaption.value.trim() || null,
        taken_at: photoTakenAt.value || null,
      };
      const photoValues = imageUrls.map((imageUrl) => ({
        image_url: imageUrl,
        ...sharedValues,
      }));
      submitButton.textContent = "Saving…";
      const savedPhotos = await api(
        editingPhotoId
          ? `/rest/v1/photography_images?id=eq.${encodeURIComponent(editingPhotoId)}`
          : "/rest/v1/photography_images",
        {
          method: editingPhotoId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(editingPhotoId ? photoValues[0] : photoValues),
        },
        true,
      );
      if (!Array.isArray(savedPhotos) || savedPhotos.length !== photoValues.length) {
        throw new Error("Supabase did not authorize this change.");
      }
      photoDialog.close();
      await loadPhotos();
    } catch (error) {
      photoError.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalSubmitText;
    }
  });

  deletePhotoButton.addEventListener("click", async () => {
    const editingPhoto = photos.find(({ id }) => String(id) === photoId.value);
    if (
      !isVerifiedAuthor
      || !editingPhoto
      || !window.confirm("Delete this photograph? This cannot be undone.")
    ) {
      return;
    }
    deletePhotoButton.disabled = true;
    try {
      const deletedPhotos = await api(
        `/rest/v1/photography_images?id=eq.${encodeURIComponent(editingPhoto.id)}`,
        { method: "DELETE", headers: { Prefer: "return=representation" } },
        true,
      );
      if (!Array.isArray(deletedPhotos) || deletedPhotos.length !== 1) {
        throw new Error("Supabase did not authorize the deletion.");
      }
      photoDialog.close();
      await loadPhotos();
    } catch (error) {
      photoError.textContent = error.message;
    } finally {
      deletePhotoButton.disabled = false;
    }
  });

  importSpotifyButton.addEventListener("click", async () => {
    const spotifyValue = releaseSpotifyUrl.value.trim();
    if (!spotifyValue) {
      releaseError.textContent = "Paste a Spotify release URL first.";
      return;
    }
    releaseError.textContent = "";
    importSpotifyButton.disabled = true;
    importSpotifyButton.textContent = "Importing…";
    try {
      const spotifyUrl = normalizeHttpUrl(spotifyValue, "Spotify URL");
      const parsedSpotifyUrl = new URL(spotifyUrl);
      if (
        parsedSpotifyUrl.hostname !== "open.spotify.com"
        || !/^\/(?:intl-[^/]+\/)?(?:album|track)\//.test(parsedSpotifyUrl.pathname)
      ) {
        throw new Error("Use an open.spotify.com album or track URL.");
      }
      releaseSpotifyUrl.value = spotifyUrl;
      const response = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`,
      );
      if (!response.ok) {
        throw new Error("Spotify could not find that release.");
      }
      const metadata = await response.json();
      releaseTitle.value = metadata.title || releaseTitle.value;
      releaseCoverUrl.value = metadata.thumbnail_url || releaseCoverUrl.value;
      if (/\/album\//.test(spotifyUrl)) {
        releaseType.value = "album";
      } else if (/\/track\//.test(spotifyUrl)) {
        releaseType.value = "single";
      }
    } catch (error) {
      releaseError.textContent = `Could not import Spotify details: ${error.message}`;
    } finally {
      importSpotifyButton.disabled = false;
      importSpotifyButton.textContent = "Import details";
    }
  });

  releaseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isVerifiedAuthor) {
      releaseError.textContent = "Your author session is not authorized.";
      return;
    }
    releaseError.textContent = "";
    const submitButton = releaseForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const coverFile = releaseCoverFile.files[0];
      const coverUrl = coverFile
        ? await uploadCover(coverFile)
        : normalizeHttpUrl(releaseCoverUrl.value.trim(), "Cover image URL");
      if (!coverUrl) {
        throw new Error("Add cover artwork with Spotify import, a URL, or an upload.");
      }
      const editingReleaseId = releaseId.value;
      const releaseValues = {
        title: releaseTitle.value.trim(),
        release_type: releaseType.value,
        release_date: releaseDate.value || null,
        cover_url: coverUrl,
        spotify_url: normalizeHttpUrl(releaseSpotifyUrl.value.trim(), "Spotify URL"),
        apple_music_url: normalizeHttpUrl(releaseAppleMusicUrl.value.trim(), "Apple Music URL"),
        bandcamp_url: normalizeHttpUrl(releaseBandcampUrl.value.trim(), "Bandcamp URL"),
        soundcloud_url: normalizeHttpUrl(
          releaseSoundcloudUrl.value.trim(),
          "SoundCloud URL",
        ),
      };
      const savedReleases = await api(
        editingReleaseId
          ? `/rest/v1/music_releases?id=eq.${encodeURIComponent(editingReleaseId)}`
          : "/rest/v1/music_releases",
        {
          method: editingReleaseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(releaseValues),
        },
        true,
      );
      if (!Array.isArray(savedReleases) || savedReleases.length !== 1) {
        throw new Error("Supabase did not authorize this change.");
      }
      releaseDialog.close();
      await loadReleases();
    } catch (error) {
      releaseError.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  deleteReleaseButton.addEventListener("click", async () => {
    const editingRelease = releases.find(({ id }) => String(id) === releaseId.value);
    if (
      !isVerifiedAuthor
      || !editingRelease
      || !window.confirm(`Delete “${editingRelease.title}”? This cannot be undone.`)
    ) {
      return;
    }
    deleteReleaseButton.disabled = true;
    try {
      const deletedReleases = await api(
        `/rest/v1/music_releases?id=eq.${encodeURIComponent(editingRelease.id)}`,
        { method: "DELETE", headers: { Prefer: "return=representation" } },
        true,
      );
      if (!Array.isArray(deletedReleases) || deletedReleases.length !== 1) {
        throw new Error("Supabase did not authorize the deletion.");
      }
      releaseDialog.close();
      await loadReleases();
    } catch (error) {
      releaseError.textContent = error.message;
    } finally {
      deleteReleaseButton.disabled = false;
    }
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
        "code-js": `\`\`\`js\n${selectedText || "const example = true;"}\n\`\`\`\n`,
        "code-python": `\`\`\`python\n${selectedText || "example = True"}\n\`\`\`\n`,
        table: `| Column 1 | Column 2 |\n| --- | --- |\n| ${selectedText || "Value 1"} | Value 2 |\n`,
        link: `[${selectedText || "short name"}](https://example.com)`,
        expandable: `::: details Click to expand\n${selectedText || "Write hidden content here."}\n:::\n`,
      };
      const template = templates[button.dataset.format];
      if (!template) {
        return;
      }
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

  async function logout() {
    if (session?.access_token) {
      try {
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
        });
      } finally {
        saveSession(null);
        await loadPosts();
        if (releasesLoaded) {
          await loadReleases();
        }
        if (photosLoaded) {
          await loadPhotos();
        }
      }
    }
  }

  logoutButton.addEventListener("click", logout);
  musicLogoutButton.addEventListener("click", logout);
  photoLogoutButton.addEventListener("click", logout);

  window.addEventListener("terminal:author-login", () => {
    openAuthorLogin();
  });
  window.addEventListener("hashchange", applyRoute);
  renderAuthorState();
  authorCheckPromise = verifyAuthorSession();
  applyRoute();
})();
