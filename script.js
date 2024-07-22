function toggleNav() {
    var sidebar = document.getElementById("mySidebar");
    var mainContent = document.querySelector(".main-content");

    if (window.innerWidth > 768) { // Only handle toggle if screen width is larger than 768px
      if (sidebar.style.transform === "translateX(0px)" || sidebar.style.transform === "") {
        sidebar.style.transform = "translateX(-340px)";
        mainContent.style.marginLeft = "0";
      } else {
        sidebar.style.transform = "translateX(0px)";
        mainContent.style.marginLeft = "340px";
      }
    }
  }

  // Ensure the sidebar is properly set on page load and resize
  function initializeSidebar() {
    var sidebar = document.getElementById("mySidebar");
    var mainContent = document.querySelector(".main-content");

    if (window.innerWidth > 768) { // On larger screens, ensure sidebar is open by default
      sidebar.style.transform = "translateX(0px)";
      mainContent.style.marginLeft = "340px";
    } else { // On smaller screens, ensure sidebar is hidden
      sidebar.style.transform = "translateY(-100%)";
      mainContent.style.marginLeft = "0";
    }
  }

  // Initialize the sidebar state on page load
  initializeSidebar();

  // Reinitialize the sidebar state on window resize
  window.onresize = initializeSidebar;
