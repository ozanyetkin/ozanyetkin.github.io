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

// Generate ATS-friendly PDF for CV using jsPDF
// script.js - Generate ATS-friendly PDF using jsPDF

// Ensure jsPDF is loaded via <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ats-toggle-btn');
  if (btn) btn.addEventListener('click', generateATS);
});

function generateATS() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  const lineHeight = 14;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Load photo if available
  const imgEl = document.querySelector('.profile-header img');
  if (imgEl) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgEl.src;
    img.onload = () => {
      const imgH = lineHeight * 4; // height fit to 4 lines
      const imgW = (img.width / img.height) * imgH;
      const imgX = margin;
      const imgY = margin;
      // Draw PNG photo
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      doc.addImage(dataURL, 'PNG', imgX, imgY, imgW, imgH);
      buildText(imgW + margin * 0.5);
    };
  } else {
    buildText(0);
  }

  function buildText(offsetX) {
    let xStart = margin + offsetX;
    let y = margin;

    // Name
    doc.setFont('courier', 'bold'); doc.setFontSize(14);
    const name = document.querySelector('#contact-info')?.innerText.trim() || '';
    if (name) doc.text(name, xStart, y);
    y += lineHeight * 1.2;

    // Contact Info
    doc.setFont('courier', 'normal'); doc.setFontSize(10);
    document.querySelectorAll('.contact-info span').forEach(span => {
      let x = xStart;
      const labelEl = span.querySelector('strong');
      if (labelEl) {
        const label = labelEl.innerText.replace(':', '').trim() + ': ';
        doc.text(label, x, y);
        x += doc.getTextWidth(label);
      }
      span.querySelectorAll('a').forEach((a, i) => {
        const text = a.innerText.trim();
        doc.textWithLink(text, x, y, { url: a.href.trim() });
        x += doc.getTextWidth(text);
        if (i < span.querySelectorAll('a').length - 1) {
          const sep = ' | ';
          doc.text(sep, x, y);
          x += doc.getTextWidth(sep);
        }
      });
      y += lineHeight;
    });
    y += lineHeight;

    // Research Interests
    const riText = document.querySelector('#research-interests .section-content')?.innerText.replace(/\s+/g, ' ').trim() || '';
    if (riText) {
      doc.setFont('courier', 'bold'); doc.setFontSize(12);
      doc.text('RESEARCH INTERESTS', margin, y);
      y += lineHeight;
      doc.setFont('courier', 'normal'); doc.setFontSize(10);
      const lines = doc.splitTextToSize(riText, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + lineHeight;
    }

    // Sections order
    const sections = ['education', 'work-experience', 'research-experience', 'publications', 'organized-events', 'assisted-courses', 'workshops-certificates', 'languages', 'computer-literacy'];
    sections.forEach(id => {
      const sec = document.getElementById(id);
      if (!sec) return;
      // Title
      const title = sec.querySelector('.section-title')?.innerText.trim().toUpperCase();
      if (title) {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.setFont('courier', 'bold'); doc.setFontSize(12);
        doc.text(title, margin, y);
        y += lineHeight;
        doc.setFont('courier', 'normal'); doc.setFontSize(10);
      }

      // Workshops & Certificates: separate lines
      if (id === 'workshops-certificates') {
        sec.querySelectorAll('.item').forEach(item => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          // Bullet + bold title
          const [lbl, date] = Array.from(item.querySelectorAll('.item-header span')).map(e => e.innerText.trim());
          doc.setFont('courier', 'bold');
          doc.text(`• ${lbl}`, margin, y);
          doc.setFont('courier', 'normal');
          if (date) {
            const dtW = doc.getTextWidth(date);
            doc.text(date, pageWidth - margin - dtW, y);
          }
          y += lineHeight;
          // Detail
          const detail = item.querySelector('span')?.innerText.trim() || '';
          const dlines = doc.splitTextToSize(detail, pageWidth - 2 * margin - 20);
          doc.text(dlines, margin + 20, y);
          y += dlines.length * lineHeight + lineHeight * 0.5;
        });
        return;
      }

      // Languages: two columns with bullets
      if (id === 'languages') {
        const texts = Array.from(sec.querySelectorAll('.section-content-languages .item')).map(item => {
          const sp = item.querySelectorAll('span'); return `• ${sp[0].innerText.trim()}: ${sp[2].innerText.trim()}`;
        });
        const col = (pageWidth - 2 * margin) / 2;
        const half = Math.ceil(texts.length / 2);
        for (let i = 0; i < half; i++) {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(texts[i], margin, y);
          if (texts[i + half]) doc.text(texts[i + half], margin + col, y);
          y += lineHeight;
        }
        y += lineHeight;
        return;
      }

      // Computer Literacy: groups bold titles, bullets, two columns
      if (id === 'computer-literacy') {
        sec.querySelectorAll('.section-content-computer-literacy').forEach(group => {
          const sub = group.querySelector('h3')?.innerText.trim();
          if (sub) { if (y > pageHeight - margin) { doc.addPage(); y = margin; } doc.setFont('courier', 'bold'); doc.text(sub, margin, y); y += lineHeight; doc.setFont('courier', 'normal'); }
          const texts = Array.from(group.querySelectorAll('.item')).map(item => {
            const sp = item.querySelectorAll('span'); return `• ${sp[0].innerText.trim()}: ${sp[2].innerText.trim()}`;
          });
          const col2 = (pageWidth - 2 * margin) / 2; const half2 = Math.ceil(texts.length / 2);
          for (let i = 0; i < half2; i++) {
            if (y > pageHeight - margin) { doc.addPage(); y = margin; } doc.text(texts[i], margin, y); if (texts[i + half2]) doc.text(texts[i + half2], margin + col2, y); y += lineHeight;
          }
          y += lineHeight;
        }); return;
      }

      // Generic items: bullets, bold titles, wrap labels & details, right-align dates
      sec.querySelectorAll('.item').forEach(item => {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        const [lblEl, dateEl] = item.querySelectorAll('.item-header span');
        const lbl = lblEl?.innerText.trim() || '';
        const date = dateEl?.innerText.trim() || '';
        // Title
        doc.setFont('courier', 'bold');
        const titleLines = doc.splitTextToSize(`• ${lbl}`, pageWidth - 2 * margin - doc.getTextWidth(date) - 20);
        titleLines.forEach((ln, idx) => doc.text(ln, margin, y + idx * lineHeight));
        // Date
        if (date) { const dtW = doc.getTextWidth(date); doc.setFont('courier', 'normal'); doc.text(date, pageWidth - margin - dtW, y); }
        y += titleLines.length * lineHeight;
        doc.setFont('courier', 'normal');
        // Details
        item.querySelectorAll(':scope > span').forEach(s => {
          const txt = s.innerText.trim(); if (txt) { const dls = doc.splitTextToSize(txt, pageWidth - 2 * margin - 20); doc.text(dls, margin + 20, y); y += dls.length * lineHeight; }
        });
        y += lineHeight * 0.5;
      });
      y += lineHeight;
    });

    // Save PDF
    doc.save('Ozan_Yetkin_CV.pdf');
  }
}
