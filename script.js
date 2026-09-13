// ===== Paste your deployed Apps Script Web App URL here =====
// Deploy code.gs as: Deploy > New deployment > Web app
//   Execute as: Me
//   Who has access: Anyone
// then copy the /exec URL it gives you into the line below.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN1NAB7eqRwrwjSZga2Kfrha_3FHOoLBRrMUIHzSJf9FL1gmUI_Dr6Zo-kfPa7vuWV_w/exec';

// ===== Element references =====
const form = document.getElementById('ctcForm');
const generateButton = document.getElementById('generateButton');
const waitingMessage = document.getElementById('waitingMessage');
const successMessage = document.getElementById('successMessage');
const downloadButton = document.getElementById('downloadButton');
const errorMessage = document.getElementById('errorMessage');

let generatedPdfBase64 = null;
let generatedFileName = 'LeaveForm.pdf';

function showEl(el) { el.classList.remove('hidden'); }
function hideEl(el) { el.classList.add('hidden'); }

// Convert yyyy-mm-dd (from <input type="date">) to dd-mm-yyyy for display in the document
function formatDateToKannadaStyle(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

// ===== Form submit =====
form.addEventListener('submit', function (e) {
  e.preventDefault();

  hideEl(successMessage);
  hideEl(downloadButton);
  hideEl(errorMessage);
  generatedPdfBase64 = null;

  let formData;
  try {
    formData = {
      name: document.getElementById('name').value,
      gerno: document.getElementById('gerno').value,
      designation: document.getElementById('designation').value,
      officename: document.getElementById('institution').value,
      place: document.getElementById('place').value,
      basic: document.getElementById('basic').value,
      scale: document.getElementById('scale').value,
      typeofleave: document.getElementById('typeofleave').value,
      from: formatDateToKannadaStyle(document.getElementById('from').value),
      to: formatDateToKannadaStyle(document.getElementById('to').value),
      reason: document.getElementById('reason').value,
      addressonleave: document.getElementById('addressonleave').value
    };
  } catch (err) {
    errorMessage.textContent = 'ದೋಷ: ಫಾರ್ಮ್ ಫೀಲ್ಡ್ ಕಂಡುಬಂದಿಲ್ಲ - ' + err.message;
    showEl(errorMessage);
    return;
  }

  generateButton.disabled = true;
  showEl(waitingMessage);

  // GET with the payload in the query string — Apps Script's /exec URL
  // always redirects, and a POST body gets dropped on that redirect
  // (browsers convert POST to GET on 301/302). GET survives intact.
  const url = APPS_SCRIPT_URL + '?data=' + encodeURIComponent(JSON.stringify(formData));

  fetch(url, { method: 'GET' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(onGenerateSuccess)
    .catch(onGenerateFailure);
});

// ===== Callbacks from Apps Script server =====
function onGenerateSuccess(result) {
  hideEl(waitingMessage);
  generateButton.disabled = false;

  if (result && result.error) {
    errorMessage.textContent = 'ದೋಷ: ' + result.error;
    showEl(errorMessage);
    return;
  }

  if (!result || !result.pdfBase64) {
    errorMessage.textContent = 'ದೋಷ: PDF ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.';
    showEl(errorMessage);
    return;
  }

  generatedPdfBase64 = result.pdfBase64;
  generatedFileName = result.fileName || 'LeaveForm.pdf';

  showEl(successMessage);
  showEl(downloadButton);
}

function onGenerateFailure(error) {
  hideEl(waitingMessage);
  generateButton.disabled = false;
  errorMessage.textContent = 'ದೋಷ: ' + (error && error.message ? error.message : error);
  showEl(errorMessage);
}

// ===== Download the generated PDF =====
downloadButton.addEventListener('click', function () {
  if (!generatedPdfBase64) return;

  const byteCharacters = atob(generatedPdfBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = generatedFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
});
