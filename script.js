const aboutDialog = document.querySelector("#aboutDialog");
const openAboutButton = document.querySelector("#openAbout");
const closeAboutButton = document.querySelector("#closeAbout");
const whyDialog = document.querySelector("#whyDialog");
const openWhyButton = document.querySelector("#openWhy");
const closeWhyButton = document.querySelector("#closeWhy");

function setupDialog(dialog, openButton, closeButton) {
  openButton.addEventListener("click", () => {
    dialog.showModal();
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

setupDialog(aboutDialog, openAboutButton, closeAboutButton);
setupDialog(whyDialog, openWhyButton, closeWhyButton);
