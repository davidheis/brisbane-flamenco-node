var signupPassword = document.getElementById('signupPassword');
var confirmPassword = document.getElementById('confirmPassword');
var matchError = document.getElementById('matchError');
var signUpForm = document.getElementById('signUpForm');

signUpForm.addEventListener('submit', function (event) {
  if (signupPassword.value === confirmPassword.value) {
    signUpForm.submit();
  } else {
    matchError.style.visibility = 'visible';
    event.preventDefault();
  }
})