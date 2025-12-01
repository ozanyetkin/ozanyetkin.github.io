function toggleNav() {
  var sidebar = document.getElementById("mySidebar");
  var mainContent = document.querySelector(".main-content");
  var downloadBtn = document.querySelector(".downloadbtn");
  var openBtn = document.querySelector(".openbtn");

  if (window.innerWidth > 768) { // Desktop: toggle sidebar left/right
    if (sidebar.style.transform === "translateX(0px)" || sidebar.style.transform === "") {
      sidebar.style.transform = "translateX(-340px)";
      mainContent.style.marginLeft = "0";
      // Delay showing download button to allow sidebar animation to complete (300ms)
      setTimeout(() => {
        downloadBtn.style.display = "flex";
      }, 300);
    } else {
      sidebar.style.transform = "translateX(0px)";
      mainContent.style.marginLeft = "340px";
      downloadBtn.style.display = "none";
    }
  } else { // Mobile: toggle sidebar top/down
    if (sidebar.style.transform === "translateY(0px)") {
      sidebar.style.transform = "translateY(-100%)";
      sidebar.setAttribute('data-open', 'false');
      openBtn.textContent = "■";
      downloadBtn.style.display = "none";
      // Re-enable body scroll
      document.body.style.overflow = "";
      // Delay hiding sidebar display to allow animation to complete
      setTimeout(() => {
        sidebar.style.display = "none";
      }, 300);
    } else {
      sidebar.style.display = "block";
      sidebar.setAttribute('data-open', 'true');
      openBtn.textContent = "⨯";
      downloadBtn.style.display = "flex";
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
      // Small delay to ensure display:block is applied before transform
      setTimeout(() => {
        sidebar.style.transform = "translateY(0px)";
      }, 10);
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
  var downloadBtn = document.querySelector(".downloadbtn");
  var openBtn = document.querySelector(".openbtn");

  if (window.innerWidth > 768) { // On larger screens, ensure sidebar is open by default
    sidebar.style.display = "block";
    sidebar.style.transform = "translateX(0px)";
    sidebar.setAttribute('data-open', 'true');
    mainContent.style.marginLeft = "340px";
    downloadBtn.style.display = "none";
    openBtn.style.display = "flex";
    openBtn.textContent = "■";
  } else { // On smaller screens, ensure sidebar is hidden
    sidebar.style.display = "none";
    sidebar.style.transform = "translateY(-100%)";
    sidebar.setAttribute('data-open', 'false');
    mainContent.style.marginLeft = "0";
    downloadBtn.style.display = "none";
    openBtn.style.display = "flex";
    openBtn.textContent = "■";
  }
}

// Initialize the sidebar state and theme on page load
initializeSidebar();
initializeTheme();

// Reinitialize the sidebar state on window resize
window.onresize = initializeSidebar;

// Swipe gesture handling for mobile sidebar
let touchStartY = 0;
let touchEndY = 0;

function handleSwipeGesture() {
  const swipeDistance = touchStartY - touchEndY;
  const sidebar = document.getElementById("mySidebar");
  const isSidebarOpen = sidebar.getAttribute('data-open') === 'true';

  // Swipe up gesture (distance > 50px) when sidebar is open
  if (swipeDistance > 50 && isSidebarOpen && window.innerWidth <= 768) {
    toggleNav();
  }
}

document.addEventListener('touchstart', (e) => {
  const sidebar = document.getElementById("mySidebar");
  const isSidebarOpen = sidebar.getAttribute('data-open') === 'true';

  if (isSidebarOpen && window.innerWidth <= 768) {
    touchStartY = e.changedTouches[0].screenY;
  }
}, false);

document.addEventListener('touchend', (e) => {
  const sidebar = document.getElementById("mySidebar");
  const isSidebarOpen = sidebar.getAttribute('data-open') === 'true';

  if (isSidebarOpen && window.innerWidth <= 768) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
  }
}, false);

// Mobile scroll detection to hide/show buttons
let lastScrollTop = 0;
let scrollTimeout;

window.addEventListener('scroll', () => {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("mySidebar");
    const isSidebarOpen = sidebar.getAttribute('data-open') === 'true';

    // Don't hide buttons if sidebar is open
    if (isSidebarOpen) {
      return;
    }

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const themeToggle = document.querySelector('.theme-toggle');
    const openBtn = document.querySelector('.openbtn');
    const buttonBar = document.querySelector('.mobile-button-bar');

    // Clear previous timeout
    clearTimeout(scrollTimeout);

    if (currentScroll > lastScrollTop && currentScroll > 50) {
      // Scrolling down - hide buttons and bar
      themeToggle.style.transform = 'translateY(-80px)';
      openBtn.style.transform = 'translateY(-80px)';
      if (buttonBar) buttonBar.style.transform = 'translateY(-80px)';
    } else {
      // Scrolling up - show buttons and bar
      themeToggle.style.transform = 'translateY(0)';
      openBtn.style.transform = 'translateY(0)';
      if (buttonBar) buttonBar.style.transform = 'translateY(0)';
    }

    // Reset button position after scrolling stops for 1 second
    scrollTimeout = setTimeout(() => {
      themeToggle.style.transform = 'translateY(0)';
      openBtn.style.transform = 'translateY(0)';
      if (buttonBar) buttonBar.style.transform = 'translateY(0)';
    }, 1000);

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }
}, false);

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.sidebar a');

  // Auto-close sidebar when link is clicked on mobile
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("mySidebar");
        const isSidebarOpen = sidebar.getAttribute('data-open') === 'true';
        if (isSidebarOpen) {
          e.preventDefault(); // Prevent immediate scroll

          // Add visual feedback - highlight the clicked link
          navLinks.forEach(l => l.style.background = '');
          link.style.background = 'var(--accent-color)';
          link.style.color = 'var(--bg-color)';

          // Close sidebar after a brief delay to show selection
          setTimeout(() => {
            toggleNav();

            // Scroll to target after sidebar is closed
            setTimeout(() => {
              const targetId = link.getAttribute('href');
              const targetElement = document.querySelector(targetId);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              // Reset link style
              link.style.background = '';
              link.style.color = '';
            }, 350); // Wait for sidebar close animation
          }, 300); // Show selection for 300ms
        }
      }
    });
  });

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Adjust offset based on screen size
    const offset = window.innerWidth <= 768 ? 100 : 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      // Check if current scroll position is within this section
      if (scrollPosition >= sectionTop - offset && scrollPosition < sectionTop + sectionHeight - offset) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');

        // Update mobile bar title on mobile devices
        if (window.innerWidth <= 768) {
          const mobileBarTitle = document.querySelector('.mobile-bar-title');
          if (mobileBarTitle) {
            const linkText = link.innerText.trim().replace(/^-\s*/, '');
            mobileBarTitle.textContent = linkText || 'Ozan Yetkin';
          }
        }
      }
    });
  });
});

// Generate ATS-friendly PDF for CV using jsPDF
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ats-toggle-btn');
  if (btn) btn.addEventListener('click', generateATS);
});

function generateATS() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'A4' });
  const margin = 40;
  const lineHeight = 14;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load and draw photo
  const imgEl = document.querySelector('.profile-header img');
  if (imgEl) {
    const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = imgEl.src;
    img.onload = () => {
      const imgH = lineHeight * 5.4;
      const imgW = (img.width / img.height) * imgH;
      const imgX = margin;
      const imgY = margin;
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      doc.addImage(dataURL, 'PNG', imgX, imgY, imgW, imgH);
      buildText(imgW + 10);
    };
  } else {
    buildText(0);
  }

  function buildText(offsetX) {
    let xStart = margin + offsetX;
    let y = margin;

    // Name
    const name = document.querySelector('#contact-info')?.innerText.trim() || '';
    if (name) {
      doc.setTextColor('#1a73e8'); doc.setFont('courier', 'bold').setFontSize(14);
      doc.text(name, xStart, y);
      y += lineHeight * 1.2;

      // Title
      doc.setFont('courier', 'bold').setFontSize(12);
      const titleElement = document.querySelector('.profile-info h2');
      const title = titleElement ? titleElement.innerText.trim() : 'Researcher | Developer | Designer';
      doc.setTextColor('#000000');
      doc.text(title, xStart, y);
      y += lineHeight * 1.2;

      doc.setTextColor('#000000');
    }


    // Contact Info: bold labels, comma-separated, link colored & underlined
    doc.setFont('courier', 'normal').setFontSize(10);
    document.querySelectorAll('.contact-info span').forEach(span => {
      let x = xStart;
      const labelEl = span.querySelector('strong');
      if (labelEl) {
        const label = labelEl.innerText.replace(':', '').trim() + ': ';
        doc.setFont('courier', 'bold'); doc.text(label, x, y);
        x += doc.getTextWidth(label);
      }
      const links = Array.from(span.querySelectorAll('a'));
      links.forEach((a, i) => {
        const text = a.innerText.trim();
        doc.setTextColor('#fe4f68').setFont('courier', 'normal');
        doc.textWithLink(text, x, y, { url: a.href.trim() });
        const w = doc.getTextWidth(text);
        doc.setDrawColor('#fe4f68').setLineWidth(0.5);
        doc.line(x, y + 1, x + w, y + 1);
        x += w;
        if (i < links.length - 1) {
          const sep = ', ';
          doc.setTextColor('#000000');
          doc.text(sep, x, y);
          x += doc.getTextWidth(sep);
        }
        doc.setTextColor('#000000');
      });
      y += lineHeight;
    });
    y += lineHeight;

    // Research Interests: wrap
    const riEl = document.querySelector('#research-interests .section-content');
    const riText = riEl?.innerText.replace(/\s+/g, ' ').trim() || '';
    if (riText) {
      doc.setTextColor('#1a73e8').setFont('courier', 'bold').setFontSize(12);
      doc.text('RESEARCH INTERESTS', margin, y);
      y += lineHeight;
      doc.setTextColor('#000000').setFont('courier', 'bold').setFontSize(10);
      const availW = pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(riText, availW);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + lineHeight;
    }

    // ATS-friendly unique section mapping
    const sectionMapping = {
      'education': 'EDUCATION',
      'work-experience': 'PROFESSIONAL EXPERIENCE',
      'research-experience': 'RESEARCH PROJECTS',
      'publications': 'PUBLICATIONS',
      'organized-events': 'LEADERSHIP & EVENTS',
      'assisted-courses': 'TEACHING EXPERIENCE',
      'workshops-certificates': 'CERTIFICATIONS',
      'languages': 'LANGUAGES',
      'computer-literacy': 'TECHNICAL SKILLS'
    };

    // Group sections by standard titles
    const groupedSections = {};
    const sections = ['education', 'work-experience', 'research-experience', 'publications', 'organized-events', 'assisted-courses', 'workshops-certificates', 'languages', 'computer-literacy'];

    sections.forEach(id => {
      const standardTitle = sectionMapping[id];
      if (!groupedSections[standardTitle]) {
        groupedSections[standardTitle] = [];
      }
      groupedSections[standardTitle].push(id);
    });

    // Render sections in standard order
    const standardOrder = ['EDUCATION', 'PROFESSIONAL EXPERIENCE', 'RESEARCH PROJECTS', 'PUBLICATIONS', 'LEADERSHIP & EVENTS', 'TEACHING EXPERIENCE', 'CERTIFICATIONS', 'LANGUAGES', 'TECHNICAL SKILLS'];

    standardOrder.forEach(standardTitle => {
      if (!groupedSections[standardTitle]) return;

      // Print section header once
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.setTextColor('#1a73e8').setFont('courier', 'bold').setFontSize(12);
      doc.text(standardTitle, margin, y); y += lineHeight;
      doc.setTextColor('#000000').setFont('courier', 'normal').setFontSize(10);

      groupedSections[standardTitle].forEach(id => {
        const sec = document.getElementById(id); if (!sec) return;

        if (id === 'workshops-certificates') {
          sec.querySelectorAll('.item').forEach(item => {
            if (y > pageHeight - margin) { doc.addPage(); y = margin; }
            const [lblEl, dateEl] = item.querySelectorAll('.item-header span');
            const lbl = lblEl?.innerText.trim() || ''; const date = dateEl?.innerText.trim() || '';
            const entity = item.querySelector(':scope>span')?.innerText.trim() || '';

            const dtW = date ? doc.getTextWidth(date) : 0;
            const availW = pageWidth - 2 * margin - dtW;

            // Split text to handle bold formatting
            const bulletAndLabel = `- ${lbl}`;
            const commaAndEntity = entity ? `, ${entity}` : '';

            doc.setFont('courier', 'bold');
            const boldLines = doc.splitTextToSize(bulletAndLabel, availW);

            boldLines.forEach((ln, i) => {
              doc.text(ln, margin, y + i * lineHeight);
              if (i === boldLines.length - 1 && commaAndEntity) {
                const boldWidth = doc.getTextWidth(ln);
                doc.setFont('courier', 'normal');
                const normalLines = doc.splitTextToSize(commaAndEntity, availW - boldWidth);
                doc.text(normalLines[0] || commaAndEntity, margin + boldWidth, y + i * lineHeight);
                if (normalLines.length > 1) {
                  normalLines.slice(1).forEach((normalLn, j) => {
                    doc.text(normalLn, margin, y + (i + j + 1) * lineHeight);
                  });
                }
              }
            });

            if (date) {
              doc.setFont('courier', 'bold');
              doc.text(date, pageWidth - margin - dtW, y);
            }

            const totalLines = boldLines.length + (commaAndEntity && boldLines.length > 0 ? Math.max(0, doc.splitTextToSize(commaAndEntity, availW - doc.getTextWidth(boldLines[boldLines.length - 1])).length - 1) : 0);
            y += totalLines * lineHeight + lineHeight * 0.5;
          }); y += lineHeight; return;
        }

        if (id === 'languages') {
          const items = Array.from(sec.querySelectorAll('.section-content-languages .item'));
          const arr = items.map(it => ({ name: it.querySelectorAll('span')[0].innerText.trim(), level: it.querySelectorAll('span')[2].innerText.trim() }));
          const col = (pageWidth - 2 * margin) / 2; const half = Math.ceil(arr.length / 2);
          for (let i = 0; i < half; i++) {
            if (y > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.setFont('courier', 'bold'); doc.text(`- ${arr[i].name}`, margin, y);
            doc.setFont('courier', 'normal'); doc.text(`: ${arr[i].level}`, margin + doc.getTextWidth(`- ${arr[i].name}`), y);
            if (arr[i + half]) {
              doc.setFont('courier', 'bold'); doc.text(`- ${arr[i + half].name}`, margin + col, y);
              doc.setFont('courier', 'normal'); doc.text(`: ${arr[i + half].level}`, margin + col + doc.getTextWidth(`- ${arr[i + half].name}`), y);
            } y += lineHeight;
          } y += lineHeight; return;
        }

        if (id === 'computer-literacy') {
          sec.querySelectorAll('.section-content-computer-literacy').forEach(gr => {
            const sub = gr.querySelector('h3')?.innerText.trim();
            if (sub) {
              if (y > pageHeight - margin) { doc.addPage(); y = margin; } doc.setFont('courier', 'bold').setFontSize(11);
              doc.text(sub, margin, y); y += lineHeight; doc.setFont('courier', 'normal').setFontSize(10);
            }
            const arr = Array.from(gr.querySelectorAll('.item')).map(it => ({ name: it.querySelectorAll('span')[0].innerText.trim(), level: it.querySelectorAll('span')[2].innerText.trim() }));
            const col2 = (pageWidth - 2 * margin) / 2; const half2 = Math.ceil(arr.length / 2);
            for (let i = 0; i < half2; i++) {
              if (y > pageHeight - margin) { doc.addPage(); y = margin; } doc.setFont('courier', 'bold'); doc.text(`- ${arr[i].name}`, margin, y);
              doc.setFont('courier', 'normal'); doc.text(`: ${arr[i].level}`, margin + doc.getTextWidth(`- ${arr[i].name}`), y);
              if (arr[i + half2]) {
                doc.setFont('courier', 'bold'); doc.text(`- ${arr[i + half2].name}`, margin + col2, y);
                doc.setFont('courier', 'normal'); doc.text(`: ${arr[i + half2].level}`, margin + col2 + doc.getTextWidth(`- ${arr[i + half2].name}`), y);
              } y += lineHeight;
            } y += lineHeight;
          }); return;
        }

        sec.querySelectorAll('.item').forEach(item => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          const [lblEl, dateEl] = item.querySelectorAll('.item-header span'); const lbl = lblEl?.innerText.trim() || ''; const date = dateEl?.innerText.trim() || '';
          const dtW = date ? doc.getTextWidth(date) : 0; const availW = pageWidth - 2 * margin - dtW - 20;
          doc.setFont('courier', 'bold'); const lines = doc.splitTextToSize(`- ${lbl}`, availW);
          lines.forEach((ln, i) => doc.text(ln, margin, y + i * lineHeight));
          if (date) { doc.setFont('courier', 'bold'); doc.text(date, pageWidth - margin - dtW, y); }
          y += lines.length * lineHeight;
          const detail = item.querySelector(':scope > span')?.innerText.trim() || '';
          if (detail) { const dls = doc.splitTextToSize(detail, availW - 20); doc.setFont('courier', 'normal'); doc.text(dls, margin + 20, y); y += dls.length * lineHeight; }
          y += lineHeight * 0.5;
        }); y += lineHeight;
      });
    });

    // Portfolio at bottom: QR to right, text
    const portfolio = document.getElementById('portfolio');
    if (portfolio) {
      if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
      doc.setTextColor('#1a73e8').setFont('courier', 'bold').setFontSize(12);
      doc.text('PORTFOLIO', margin, y); y += lineHeight;
      doc.setTextColor('#000000').setFont('courier', 'normal').setFontSize(10);
      const message = 'Thank you for your time, please click the link or scan the QR code to enjoy some of my works';
      const availW = pageWidth - 2 * margin - 120; const msgLines = doc.splitTextToSize(message, availW);
      doc.text(msgLines, margin, y);
      // QR on right
      const link = 'https://ozanyetkin.com/#portfolio';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(link)}`;
      const qrImg = new Image(); qrImg.crossOrigin = 'Anonymous'; qrImg.src = qrUrl;
      qrImg.onload = () => {
        doc.addImage(qrImg, 'PNG', pageWidth - margin - 50, y - 20, 50, 50);
        doc.setTextColor('#000000').setFont('courier', 'normal');
        const msgLines = doc.splitTextToSize(message, availW);
        doc.text(msgLines, margin, y);
        y += msgLines.length * lineHeight + lineHeight * 0.5;
        doc.setTextColor('#fe4f68').setFont('courier', 'bold');
        doc.textWithLink('View Portfolio', margin, y, { url: link });
        doc.setTextColor('#000000'); doc.save('Ozan_Yetkin_CV_ATS.pdf');
      };
    } else {
      doc.save('Ozan_Yetkin_CV.pdf');
    }
  }
}
