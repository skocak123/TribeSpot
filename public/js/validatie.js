function showError(field, message) {
  clearError(field);
  field.classList.add("error-field");

  const error = document.createElement("p");
  error.className = "error-message";
  error.textContent = message;
  field.after(error);
}

function clearError(field) {
  field.classList.remove("error-field");

  const next = field.nextElementSibling;
  if (next !== null && next.classList.contains("error-message")) {
    next.remove();
  }
}

// Controleer bij het verlaten van een veld, en daarna bij elke wijziging zolang er een fout staat.
function watchField(input, field, check) {
  input.addEventListener("blur", check);
  input.addEventListener("input", function () {
    if (field.classList.contains("error-field")) {
      check();
    }
  });
}

function checkLength(input, field, name, min, max) {
  const value = input.value.trim();

  if (value === "") {
    showError(field, "Vul je " + name + " in.");
    return false;
  }
  if (value.length < min) {
    showError(field, "Je " + name + " moet minimaal " + min + " tekens zijn.");
    return false;
  }
  if (value.length > max) {
    showError(field, "Je " + name + " mag maximaal " + max + " tekens zijn.");
    return false;
  }
  clearError(field);
  return true;
}

function checkEmail(input) {
  const email = input.value.trim();

  if (email === "") {
    showError(input, "Vul je HU-e-mailadres in.");
    return false;
  }
  if (!/^[^\s@]+@student\.hu\.nl$/i.test(email)) {
    showError(input, "Gebruik je HU-e-mailadres (naam@student.hu.nl).");
    return false;
  }
  clearError(input);
  return true;
}

// Inloggen
const loginButton = document.querySelector(".login-button");

if (loginButton !== null) {
  const loginEmail = document.querySelector(".login-email");
  const loginPassword = document.querySelector(".login-password");

  function checkLoginEmail() {
    return checkEmail(loginEmail);
  }

  function checkLoginPassword() {
    if (loginPassword.value === "") {
      showError(loginPassword, "Vul je wachtwoord in.");
      return false;
    }
    clearError(loginPassword);
    return true;
  }

  watchField(loginEmail, loginEmail, checkLoginEmail);
  watchField(loginPassword, loginPassword, checkLoginPassword);

  loginButton.addEventListener("click", function () {
    const emailOk = checkLoginEmail();
    const passwordOk = checkLoginPassword();

    if (emailOk && passwordOk) {
      window.location.href = "regelspagina.html";
    }
  });
}

// Profiel aanmaken
const profileButton = document.querySelector(".profile-button");

if (profileButton !== null) {
  const nameInput = document.querySelector(".profile-name");
  const usernameInput = document.querySelector(".profile-username");
  const emailInput = document.querySelector(".profile-email");
  const passwordInput = document.querySelector(".profile-password");
  const tribeRow = document.querySelector(".tribe-row");
  const tribeInputs = tribeRow.querySelectorAll("input");
  const helpInput = document.querySelector(".profile-help");

  function checkName() {
    return checkLength(nameInput, nameInput, "naam", 2, 100);
  }

  function checkUsername() {
    if (!checkLength(usernameInput, usernameInput, "gebruikersnaam", 3, 20)) {
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value.trim())) {
      showError(usernameInput, "Gebruik alleen letters, cijfers en _.");
      return false;
    }
    return true;
  }

  function checkProfileEmail() {
    return checkEmail(emailInput);
  }

  function checkPassword() {
    const password = passwordInput.value;

    if (password.length < 8) {
      showError(passwordInput, "Je wachtwoord moet minimaal 8 tekens zijn.");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      showError(passwordInput, "Je wachtwoord moet minstens één cijfer bevatten.");
      return false;
    }
    clearError(passwordInput);
    return true;
  }

  function checkTribe() {
    for (let i = 0; i < tribeInputs.length; i++) {
      if (tribeInputs[i].checked) {
        clearError(tribeRow);
        return true;
      }
    }
    showError(tribeRow, "Kies je tribe.");
    return false;
  }

  function checkHelp() {
    if (helpInput.value.trim().length > 100) {
      showError(helpInput, "Maximaal 100 tekens.");
      return false;
    }
    clearError(helpInput);
    return true;
  }

  watchField(nameInput, nameInput, checkName);
  watchField(usernameInput, usernameInput, checkUsername);
  watchField(emailInput, emailInput, checkProfileEmail);
  watchField(passwordInput, passwordInput, checkPassword);
  watchField(helpInput, helpInput, checkHelp);

  for (let i = 0; i < tribeInputs.length; i++) {
    tribeInputs[i].addEventListener("change", checkTribe);
  }

  profileButton.addEventListener("click", function () {
    const nameOk = checkName();
    const usernameOk = checkUsername();
    const emailOk = checkProfileEmail();
    const passwordOk = checkPassword();
    const tribeOk = checkTribe();
    const helpOk = checkHelp();

    if (nameOk && usernameOk && emailOk && passwordOk && tribeOk && helpOk) {
      window.location.href = "regelspagina.html";
    }
  });
}
