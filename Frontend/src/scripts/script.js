import { DataBase } from "./config.js";
(function() {
  let cropper;
  const cropModal = document.getElementById("crop-modal");
  const cropImage = document.getElementById("crop-image");
  const cropButton = document.getElementById("crop-button");
  const cancelCrop = document.getElementById("cancel-crop");
  const pictureInput = document.getElementById("picture");
  const canvas = document.getElementById("image-preview");
  const previewSection = document.getElementById("preview-section");
  const croppedPreview = document.getElementById("cropped-preview");
  const previewImageInUploadContainer = document.querySelector('.upload-container img.preview-image');
  const instructions = document.getElementById("upload-instructions");
  const fileNameDisplay = document.getElementById("file-name");

  pictureInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      const labelFileName = document.getElementById("label-file-name");
      labelFileName.textContent = file.name;
      labelFileName.style.display = "inline";
      instructions.style.display = "none";
      const reader = new FileReader();
      reader.onload = function(e) {
        cropImage.src = e.target.result;
        cropModal.style.display = "flex";
        if (cropper) {
          cropper.destroy();
        }
        cropper = new Cropper(cropImage, { aspectRatio: 1, viewMode: 1 });
      };
      reader.readAsDataURL(file);
    }
  });

  cropButton.addEventListener("click", function() {
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 256,
        height: 256,
      });
      const compressedDataUrl = croppedCanvas.toDataURL("image/webp", 0.5);
      document.getElementById("croppedData").value = compressedDataUrl;
      previewImageInUploadContainer.src = compressedDataUrl;
      previewImageInUploadContainer.style.display = 'block';
      const ctx = canvas.getContext("2d");
      canvas.width = 256;
      canvas.height = 256;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(croppedCanvas, 0, 0);
      croppedPreview.src = compressedDataUrl;
      previewSection.style.display = "block";
      cropModal.style.display = "none";
      cropper.destroy();
      cropper = null;
      pictureInput.value = "";
    }
  });

  cancelCrop.addEventListener("click", function() {
    cropModal.style.display = "none";
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    pictureInput.value = "";
    croppedPreview.src = "";
    previewSection.style.display = "none";
    const labelFileName = document.getElementById("label-file-name");
    labelFileName.textContent = "";
    labelFileName.style.display = "none";
    instructions.style.display = "inline";
    previewImageInUploadContainer.src = "";
    previewImageInUploadContainer.style.display = "none";
    fileNameDisplay.style.display = "none";
  });

  async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const sendButton = document.getElementById("send-button");
    sendButton.disabled = true;
    const nameInput = form.querySelector("#name");
    const kusInput = form.querySelector("#KUS");
    const pictureInput = form.querySelector("#picture");
    const pictureError = form.querySelector("#picture-error");
    const croppedData = form.querySelector("#croppedData").value;
    let hasError = false;
    if (!nameInput.value.trim()) {
      form.querySelector("#name-error").style.display = "block";
      hasError = true;
    } else {
      form.querySelector("#name-error").style.display = "none";
    }
    if (!kusInput.value.trim()) {
      form.querySelector("#kus-error").style.display = "block";
      hasError = true;
    } else {
      form.querySelector("#kus-error").style.display = "none";
    }
    if ((!pictureInput.files || pictureInput.files.length === 0) && !croppedData) {
      pictureError.style.display = "block";
      hasError = true;
    } else {
      pictureError.style.display = "none";
    }
    if (hasError) {
      sendButton.disabled = false;
      return;
    }
    const auth = getUrlParameter("auth");
    const id = getUrlParameter("id");
    const token = getUrlParameter("token");
    const data = {
      name: nameInput.value,
      KUS: kusInput.value,
      picture: canvas.toDataURL("image/webp", 0.5),
      auth: auth || "null",
      id: id || "null",
      token: token || "null",
    };
    const url = form.action;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        sendButton.disabled = false;
        if (xhr.status === 200) {
          form.querySelector(".form-elements").style.display = "none";
          document.getElementById("preview-section").style.display = "none";
          form.querySelector(".thankyou_message").style.display = "block";
        }
      }
    };
    const encoded = Object.keys(data)
      .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
      .join("&");
    xhr.send(encoded);
  }

  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function decrypt(encoded) {
    return atob(encoded);
  }

  function loaded() {
    const forms = document.querySelectorAll("form.gform");
    for (let i = 0; i < forms.length; i++) {
      forms[i].setAttribute("action", decrypt(DataBase));
      forms[i].addEventListener("submit", handleFormSubmit, false);
    }
  }
  document.addEventListener("DOMContentLoaded", loaded, false);

  document.addEventListener("DOMContentLoaded", () => {
    const uploadContainer = document.getElementById("upload-preview");
    const fileInput = document.getElementById("picture");
    const previewImage = document.getElementById("preview-image");
    const fileNameDisplay = document.getElementById("file-name");
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      uploadContainer.addEventListener(eventName, e => e.preventDefault());
      uploadContainer.addEventListener(eventName, e => e.stopPropagation());
    });
    uploadContainer.addEventListener("dragover", () => {
      uploadContainer.classList.add("drag-over");
    });
    ["dragleave", "drop"].forEach(eventName => {
      uploadContainer.addEventListener(eventName, () => {
        uploadContainer.classList.remove("drag-over");
      });
    });
    uploadContainer.addEventListener("drop", e => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        fileInput.files = e.dataTransfer.files;
        const labelFileName = document.getElementById("label-file-name");
        labelFileName.textContent = `${file.name}`;
        labelFileName.style.display = "inline";
        instructions.style.display = "none";
        const reader = new FileReader();
        reader.onload = event => {
          cropImage.src = event.target.result;
          cropModal.style.display = "flex";
          if (cropper) {
            cropper.destroy();
          }
          cropper = new Cropper(cropImage, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
      }
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) {
        fileNameDisplay.style.display = "none";
        const reader = new FileReader();
        reader.onload = event => {
          previewImage.src = event.target.result;
          previewImage.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  });
})();