  // confirm blog deletion
  var deleteForm = document.getElementById('deleteForm');
  deleteForm.addEventListener('submit', function (event) {

    if (window.confirm('Really delete?')) {
      deleteForm.submit();
    } else {
      event.preventDefault();
    }

  })