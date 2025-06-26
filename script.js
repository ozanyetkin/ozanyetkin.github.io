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

// Theme toggle functionality
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('theme-icon');
  const currentTheme = body.getAttribute('data-theme');

  if (currentTheme === 'light') {
    body.removeAttribute('data-theme');
    themeIcon.textContent = '⬤';
    localStorage.setItem('theme', 'dark');
  } else {
    body.setAttribute('data-theme', 'light');
    themeIcon.textContent = '⬤';
    localStorage.setItem('theme', 'light');
  }
}

// Initialize theme from localStorage
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const themeIcon = document.getElementById('theme-icon');

  if (savedTheme === 'light') {
    document.body.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '⬤';
  } else {
    document.body.removeAttribute('data-theme');
    themeIcon.textContent = '⬤';
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

// Initialize the sidebar state and theme on page load
initializeSidebar();
initializeTheme();

// Reinitialize the sidebar state on window resize
window.onresize = initializeSidebar;

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.sidebar a');

  window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop - sectionHeight / 3) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  });
});

// CV generator
document.getElementById("ats-toggle-btn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("Courier", "normal");
  doc.setFontSize(11);

  const marginLeft = 40;
  const indent = 20;
  const maxWidth = 500;
  const lineHeight = 14;
  let y = 40;

  function drawBlock(title, items, options = {}) {
    const { columns = 1 } = options;

    doc.setFont("Courier", "bold");
    doc.text(title, marginLeft, y);
    y += lineHeight;
    doc.setFont("Courier", "normal");

    if (columns === 1) {
      items.forEach(group => {
        const [title, date, desc] = group;
        const bullet = `• ${title}${date ? " (" + date + ")" : ""}`;

        const bulletLines = doc.splitTextToSize(bullet, maxWidth);
        bulletLines.forEach(line => {
          if (y > 780) {
            doc.addPage();
            y = 40;
          }
          doc.text(line, marginLeft, y);
          y += lineHeight;
        });

        if (desc) {
          const descLines = doc.splitTextToSize(desc, maxWidth - indent);
          descLines.forEach(line => {
            if (y > 780) {
              doc.addPage();
              y = 40;
            }
            doc.text(line, marginLeft + indent, y);
            y += lineHeight;
          });
        }

        y += lineHeight;
      });
    } else {
      const flatItems = items.flat().map(i => i.replace(/<br\s*\/?\s*>/gi, " ").trim());
      const rows = Math.ceil(flatItems.length / columns);
      const columnGap = 40;
      const colWidth = (maxWidth - columnGap * (columns - 1)) / columns;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const i = row + col * rows;
          if (i < flatItems.length) {
            doc.text(flatItems[i], marginLeft + col * (colWidth + columnGap), y);
          }
        }
        y += lineHeight;
      }
      y += lineHeight;
    }
  }

  function collectSpanItems(selector) {
    return [...document.querySelectorAll(selector)].map(item => {
      const headerSpans = [...item.querySelectorAll(".item-header span")].map(s => s.textContent.trim());
      const desc = item.querySelector(".item-header ~ span")?.textContent.trim() || "";
      return [headerSpans[0] || "", headerSpans[1] || "", desc];
    });
  }

  function collectFlatText(selector) {
    return [...document.querySelectorAll(selector)]
      .map(el => [el.innerHTML.trim()])
      .filter(g => g[0].length);
  }

  const basicInfo = [...document.querySelectorAll(".profile-info p")].map(p => [p.textContent.trim()]);
  drawBlock("Ozan Yetkin", basicInfo);

  const sections = [
    { id: "research-interests", title: "Research Interests" },
    { id: "education", title: "Education" },
    { id: "work-experience", title: "Work Experience" },
    { id: "research-experience", title: "Research Experience" },
    { id: "publications", title: "Publications" },
    { id: "organized-events", title: "Organized Events" },
    { id: "assisted-courses", title: "Assisted Courses" },
    { id: "languages", title: "Languages" },
    { id: "workshops-certificates", title: "Workshops & Certificates" }
  ];

  sections.forEach(({ id, title }) => {
    const section = document.getElementById(id);
    if (!section) return;
    const itemGroups = collectSpanItems(`#${id} .item`);
    if (itemGroups.length > 0) {
      drawBlock(title, itemGroups);
    } else {
      const fallback = collectFlatText(`#${id} p, #${id} li`);
      if (fallback.length > 0) drawBlock(title, fallback);
    }
  });

  const compTools = [...document.querySelectorAll("#computer-literacy li")].map(li => [li.textContent.trim()]);
  if (compTools.length > 0) drawBlock("Computer Literacy & Tools", compTools, { columns: 2 });

  doc.save("Ozan_Yetkin_ATS_CV.pdf");
});