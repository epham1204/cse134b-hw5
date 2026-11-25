const form = document.querySelector("form");
const nameField = document.getElementById("name");
const emailField = document.getElementById("email");
const commentsField = document.getElementById("comments");
const fields = [nameField, emailField, commentsField];

const errorArea = document.getElementById("form-errors-area");
const errorHeading = errorArea.querySelector("h3");
const infoArea = document.getElementById("form-info-area");
const commentsInfo = document.getElementById("comments-info");
const historyField = document.getElementById("form-errors");

// History of validation errors from failed submission attempts.
// Entries never contain what the user typed.
const form_errors = [];

// Readable field names used in messages
const fieldLabels = {
  name: "Name",
  email: "Email",
  comments: "Your message"
};

// Remaining characters at which the counter turns into a warning
const WARNING_THRESHOLD = 100;

// Fields the user has typed in, and fields whose error is on screen
const editedFields = new Set();
const shownErrors = new Set();

// Rechecks one field and returns its error message ("" when valid).
// Only reads .validity, so it never fires an invalid event.
function checkField(field) {
  // clear the old message first so a fixed field is not still blocked
  field.setCustomValidity("");

  const label = fieldLabels[field.id];
  const validity = field.validity;
  let message = "";

  if (validity.valueMissing) {
    message = `${label} is required. Please fill in this field.`;
  } else if (validity.typeMismatch) {
    message = `${label} is not a valid email address. Use a format like name@example.com.`;
  } else if (validity.tooShort) {
    message = `${label} is too short. Enter at least ${field.minLength} characters (you have ${field.value.length}).`;
  } else if (!validity.valid) {
    // any other native problem keeps the browser's own wording
    message = `${label}: ${field.validationMessage}`;
  }

  field.setCustomValidity(message);
  return message;
}

// Shows or removes one field's line in the error area
function showError(field, message) {
  const line = document.getElementById(`${field.id}-error`);
  line.textContent = message;
  line.hidden = message === "";

  if (message === "") {
    shownErrors.delete(field);
  } else {
    shownErrors.add(field);
  }

  // the heading only appears while at least one error is listed
  errorHeading.hidden = shownErrors.size === 0;
}

// Updates the remaining character count for the comments field
function updateCharacterCount() {
  const remaining = commentsField.maxLength - commentsField.value.length;

  if (remaining <= 0) {
    commentsInfo.textContent = "Character limit reached. You cannot add more text, but you can still send your message.";
    commentsInfo.dataset.state = "limit";
  } else if (remaining <= WARNING_THRESHOLD) {
    commentsInfo.textContent = `Warning: only ${remaining} characters remaining.`;
    commentsInfo.dataset.state = "warning";
  } else {
    commentsInfo.textContent = `${remaining} characters remaining.`;
    commentsInfo.dataset.state = "ok";
  }
}

fields.forEach((field) => {
  // While typing: recheck quietly, and only update an error that is already showing
  field.addEventListener("input", () => {
    editedFields.add(field);
    const message = checkField(field);
    if (shownErrors.has(field)) {
      showError(field, message);
    }
  });

  // Leaving a field the user has edited: show or remove its error
  field.addEventListener("blur", () => {
    if (editedFields.has(field)) {
      showError(field, checkField(field));
    }
  });

  // Fires once per invalid field each time the browser blocks a submission,
  // whether it came from the button or the Enter key. This is the only
  // place that adds to the history.
  field.addEventListener("invalid", () => {
    const message = checkField(field);
    showError(field, message);
    form_errors.push({
      field: field.name,
      error: message,
      time: new Date().toISOString()
    });
  });
});

commentsField.addEventListener("input", updateCharacterCount);

// Runs only when every field is valid, right before the form is sent
form.addEventListener("submit", () => {
  historyField.value = JSON.stringify(form_errors);
});

// Sets each field's message up front (without displaying it) so the
// browser's popup uses this wording on the first failed submit
function refresh() {
  fields.forEach(checkField);
  updateCharacterCount();
}

// Reveal the JavaScript-only areas
errorArea.hidden = false;
infoArea.hidden = false;
refresh();

// The browser may restore typed text when the user navigates back
window.addEventListener("pageshow", refresh);