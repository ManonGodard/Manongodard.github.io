const sheets = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIX88gIXbndOvcX_t-ebsDvmzksXA69r2IdQK_S1gsAhKe2fouJ-Il9fEwJqqsT2ApkNrc07frkZ7M/pub?gid=0&single=true&output=csv";
const response = await fetch(sheets);
const csvText = await response.text();

const sanitizeName = (name) => {
  const accentsMap = new Map([
    ['á', 'a'], ['à', 'a'], ['â', 'a'], ['ä', 'a'], ['ã', 'a'], ['å', 'a'],
    ['é', 'e'], ['è', 'e'], ['ê', 'e'], ['ë', 'e'], ['í', 'i'], ['ì', 'i'],
    ['î', 'i'], ['ï', 'i'], ['ó', 'o'], ['ò', 'o'], ['ô', 'o'], ['ö', 'o'],
    ['õ', 'o'], ['ø', 'o'], ['ú', 'u'], ['ù', 'u'], ['û', 'u'], ['ü', 'u'],
    ['ý', 'y'], ['ÿ', 'y'], ['ñ', 'n'], ['ç', 'c']
  ]);
  let sanitized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  sanitized = Array.from(sanitized).map(char => accentsMap.get(char) || char).join('');
  return sanitized.replace(/[^A-Za-z0-9_\-]/g, '_');
};

const csvToJson = (csvString) => {
  try {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }

    if (currentLine) lines.push(currentLine);

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;

      const values = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      values.push(currentValue);

      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        value = value.replace(/\r/g, '');
        if (value.includes('\n')) {
          value = value.split('\n').map(line => `<p>${line.trim()}</p>`).join('');
        }
        obj[header] = value;
      });

      result.push(obj);
    }

    return result;
  } catch (error) {
    console.error("Erreur CSV JSON:", error);
    return [];
  }
};

const _json = csvToJson(csvText);
const json = _json.slice(0, 6); // Moins de cartes pour le test
const $projets = document.querySelector(".projets");

json.forEach((item) => {
  const div = document.createElement("div");
  div.classList.add("projet");
  $projets.appendChild(div);

  const img = document.createElement("img");
  img.src = `img/${sanitizeName(item.titre)}.png`;
  div.appendChild(img);

  const titre = document.createElement("h1");
  titre.textContent = item.titre;
  div.appendChild(titre);

  const categories = document.createElement("div");
  categories.textContent = item.catégories;
  div.appendChild(categories);

  const description = document.createElement("p");
  description.textContent = item.description;
  div.appendChild(description);

  div.addEventListener("click", () => {
    const header = document.querySelector("header");
    const projets = document.querySelector(".projets");
    header.classList.add("fixed");
    projets.classList.add("fixed");

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    document.body.appendChild(overlay);

    const wrap = document.createElement("div");
    wrap.classList.add("wrap");
    overlay.appendChild(wrap);

    const fiche = document.createElement("div");
    fiche.classList.add("fiche");
    wrap.appendChild(fiche);

    const close = document.createElement("div");
    close.textContent = "×";
    close.classList.add("close");
    overlay.appendChild(close);

    const img = document.createElement("img");
    img.src = `img/${sanitizeName(item.titre)}.png`;
    fiche.appendChild(img);

    const titre = document.createElement("h1");
    titre.textContent = item.titre;
    fiche.appendChild(titre);

    const desc = document.createElement("div");
    desc.innerHTML = item.modale;
    fiche.appendChild(desc);

    if (item.images !== "") {
      const images = item.images.split(",");
      const gallery = document.createElement("div");
      gallery.classList.add("gallery");
      images.forEach((image) => {
        const img = document.createElement("img");
        const name = sanitizeName(item.titre);
        img.src = `img/${name}/${image}`;
        gallery.appendChild(img);
      });
      fiche.appendChild(gallery);

      gsap.from(gallery.children, {
        opacity: 0,
        y: 30,
        stagger: 0.05,
        duration: 0.5,
        ease: "power2.out"
      });
    }

    gsap.set(overlay, { opacity: 0 });
    gsap.set(fiche, { opacity: 0, scale: 0.8, rotation: -5 });

    gsap.to(overlay, { opacity: 1, duration: 0.4, ease: "power2.out" });
    gsap.to(fiche, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" });

    overlay.addEventListener("click", (e) => {
      if (e.target === fiche || fiche.contains(e.target)) return;
      gsap.to(overlay, { opacity: 0, duration: 0.3, ease: "power2.inOut", onComplete: () => overlay.remove() });
      header.classList.remove("fixed");
      projets.classList.remove("fixed");
    });
  });
});

// Animation de distribution des cartes avec GSAP
gsap.registerPlugin(MotionPathPlugin);

const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 3;

gsap.set(".projet", {
  x: centerX,
  y: centerY,
  scale: 0.3, // Cartes encore plus petites
  rotation: 0,
  opacity: 0,
  zIndex: 1,
});

const projets = gsap.utils.toArray(".projet");
projets.forEach((el, i) => {
  const angle = gsap.utils.random(-20, 20); // Moins de variation
  const distance = gsap.utils.random(100, 400); // Moins de distance
  const finalX = centerX + (i - (projets.length / 4)) * 100;
  const finalY = centerY + (i % 2 === 0 ? 0 : 50);

  const tl = gsap.timeline({
    delay: i * 0.6, // Lenteur de l'animation
  });

  tl.to(el, {
    x: finalX,
    y: finalY,
    rotation: gsap.utils.random(-20, 20),
    scale: 1,
    opacity: 1,
    duration: 1, // Animation plus lente
  });

  el.addEventListener("mouseenter", () => {
    gsap.to(el, {
      scale: 1.1,
      zIndex: 10,
      duration: 0.5,
      ease: "power2.out",
    });
  });

  el.addEventListener("mouseleave", () => {
    gsap.to(el, {
      scale: 1,
      x: finalX,
      zIndex: 1,
      duration: 0.5,
      ease: "power2.inOut",
    });
  });
});