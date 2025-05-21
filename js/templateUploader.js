export const TemplateUploader = {
  init() {
    const panel = document.querySelector('#leftPanel');
    if (!panel) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    panel.appendChild(input);

    const readFile = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          document.dispatchEvent(new CustomEvent('template:loaded', { detail: img }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      readFile(file);
      input.value = '';
    });

    panel.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    panel.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      readFile(file);
    });
  }
};
