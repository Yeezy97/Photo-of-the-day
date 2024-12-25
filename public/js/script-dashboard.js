"use strict";

const dashboard_menu = document.querySelectorAll(".menu-button");

dashboard_menu.forEach((item) => {
  item.addEventListener("click", function () {
    console.log(this);
    console.log(this.innerText);
  });
});

// console.log(dashboard_menu);

// document
//   .querySelector(".submit-button")
//   .addEventListener("click", function (event) {
//     event.preventDefault(); // Prevent the default form submission
//     console.log("click");

//     // const formData = new FormData(this);

//     // // Submit the form data using Fetch API or AJAX
//     // fetch("http://localhost:3000/create-post", {
//     //   method: "POST",
//     //   body: formData,
//     // })
//     //   .then((response) => response.json())
//     //   .then((data) => {
//     //     console.log("Form submitted successfully:", data);
//     //     // Optionally, update the UI instead of changing routes
//     //   })
//     //   .catch((error) => console.error("Error submitting form:", error));
//   });

// document.getElementById("myForm").addEventListener("submit", function (event) {
//   event.preventDefault(); // Prevent the default form submission

//   const formData = new FormData(this);

//   // Submit the form data using Fetch API or AJAX
//   fetch("/create-post", {
//     method: "POST",
//     body: formData,
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       console.log("Form submitted successfully:", data);
//       // Optionally, update the UI instead of changing routes
//     })
//     .catch((error) => console.error("Error submitting form:", error));
// });
