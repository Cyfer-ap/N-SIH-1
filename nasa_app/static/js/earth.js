document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('earth-form');
  const latInput = document.getElementById('lat-input');
  const lonInput = document.getElementById('lon-input');

  form.addEventListener('submit', (e) => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    let valid = true;
    let messages = [];

    if (isNaN(lat) || lat < -90 || lat > 90) {
      valid = false;
      messages.push('Latitude must be between -90 and 90.');
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      valid = false;
      messages.push('Longitude must be between -180 and 180.');
    }

    if (!valid) {
      e.preventDefault();
      alert(messages.join('\n'));
    }
  });
});
