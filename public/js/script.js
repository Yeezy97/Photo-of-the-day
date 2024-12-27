"use strict";

const nav_menu_open = document.querySelector(".mobile-menu-icon");
const nav_burger_close = document.querySelector(".mobile-menu-close");
const sidenav = document.querySelector(".sidenav");
const category_grid_item = document.querySelectorAll(".grid-item");
console.log(category_grid_item);

nav_menu_open.addEventListener("click", () => {
  sidenav.classList.toggle("active");
  //   sidenav.style.display = "grid";
});

nav_burger_close.addEventListener("click", () => {
  sidenav.classList.toggle("active");
});
