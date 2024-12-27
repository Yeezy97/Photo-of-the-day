"use strict";

const dashboard_menu = document.querySelectorAll(".menu-button");

dashboard_menu.forEach((item) => {
  item.addEventListener("click", function () {
    console.log(this);
    console.log(this.innerText);
  });
});

console.log(dashboard_menu);
