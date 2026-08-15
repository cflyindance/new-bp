import defaultImage from '../assets/images/sushi.jpg';

const handleSetImgSrc = () => {
  const allImgCard = document.getElementsByClassName('dish-item-img');
  const observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach((each) => {
      const { intersectionRatio, target } = each;
      if (intersectionRatio <= 0) return;
      const imgSrc = target.dataset.src;
      target.setAttribute('src', imgSrc);
      target.onerror = (e) => {
        e.target.onerror = null;
        e.target.src = defaultImage;
      };
      observer.unobserve(target);
    });
  });
  Array.from(allImgCard).forEach((imgItem) => {
    observer.observe(imgItem);
  });
};

export default handleSetImgSrc;
