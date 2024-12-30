"use strict";

const dashboard_menu = document.querySelectorAll(".menu-button");

dashboard_menu.forEach((item) => {
  item.addEventListener("click", function () {
    console.log(this);
    console.log(this.innerText);
  });
});

console.log(dashboard_menu);

// create-post dropdown menu function
document.addEventListener("DOMContentLoaded", function () {
  const dropdown = document.getElementById("dropdown");
  const inputField = document.getElementById("inputField");

  dropdown.addEventListener("change", function () {
    inputField.value = dropdown.value;
  });
});
