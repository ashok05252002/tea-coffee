const express = require('express');
const session = require('express-session');
const app = express();
const port = 8080;

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

let votes = { tea: 0, coffee: 0, milk: 0 };
let voters = [];
let results = []; // Array to store result values


// Admin page to view results
// Admin page to view results
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Poll Results</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
  <div class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">Poll Results</h1>
    
    <table class="w-full text-left mb-6">
      <thead>
        <tr>
          <th class="py-2 px-4 bg-blue-100 text-blue-700 font-semibold rounded-tl-lg">Option</th>
          <th class="py-2 px-4 bg-blue-100 text-blue-700 font-semibold rounded-tr-lg">Votes</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t">
          <td class="py-2 px-4">Tea</td>
          <td class="py-2 px-4">${votes.tea}</td>
        </tr>
        <tr class="border-t">
          <td class="py-2 px-4">Coffee</td>
          <td class="py-2 px-4">${votes.coffee}</td>
        </tr>
        <tr class="border-t">
          <td class="py-2 px-4">Milk</td>
          <td class="py-2 px-4">${votes.milk}</td>
        </tr>
      </tbody>
    </table>
    
    <h2 class="text-xl font-bold mb-4 text-gray-800">Voter Details</h2>
    <table class="w-full text-left border-collapse">
      <thead>
        <tr>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Name</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Vote</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold rounded-tr-lg">IP Address</th>
        </tr>
      </thead>
      <tbody>
        ${voters.map(voter => `
        <tr class="border-t">
          <td class="py-2 px-4">${voter.name}</td>
          <td class="py-2 px-4">${voter.vote}</td>
          <td class="py-2 px-4">${voter.ip}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    
    <div class="mt-4">
      <button onclick="window.location.reload();" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">Refresh</button>
      <form action="/reset" method="post" class="inline">
        <button type="submit" class="ml-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Reset Votes</button>
      </form>
    </div>
  </div>
  <script>
    setTimeout(function(){
       location.reload();
    }, 1000); // 1000 milliseconds = 1 second
  </script>
</body>
</html>
  `);
});

// Reset votes route
app.post('/reset', (req, res) => {
  votes = { tea: 0, coffee: 0, milk: 0 };
  voters = [];
  results = []; // Reset results array
  res.redirect('/admin');
});


// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/pointer', (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pointer Page</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="flex min-h-screen items-center justify-center bg-gray-100">
  <div class="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
    <h1 class="mb-4 text-2xl font-bold">Send Notification</h1>
    <form action="/save-result" method="post">
      <button type="submit" class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6 inline-block">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      </button>
    </form>
  </div>
</body>
</html>

  `);
});

app.post('/save-result', (req, res) => {
  // Check if there is a current value and if it is 1
  if (results.length > 0 && results[results.length - 1] === 1) {
    results[results.length - 1] = 0; // Set the last value to 0
  } else {
    results.push(1); // Add a new value of 1 if the last value is not 1
  }
  res.redirect('/pointer');
});


app.get('/result', (req, res) => {
  const resultValue = results.length > 0 ? results[results.length - 1] : '0';
  res.send(`${resultValue}
  `);
});



// Poll page
app.get('/', (req, res) => {
  res.send(`
    <?php
$user_ip = $_SERVER['REMOTE_ADDR'];
$default_name = ($user_ip === '192.168.29.52') ? 'Ashok' : '';
?>

   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tea or Coffee Poll</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      background-image: url('https://img.freepik.com/free-photo/top-view-cup-tea-inside-plate-cup-dark-background-tea-drink-color-photo-sweet_140725-55772.jpg?w=1380&t=st=1724751652~exp=1724752252~hmac=22eab7681d422bc5fa5f44f57b0af8393983def6b8b40ad91560c31ff152c2cf');
      background-size: cover;
      background-position: center;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
    <h1 class="text-2xl font-bold mb-4">Tea or Coffee?</h1>
    <form id="pollForm" action="/vote" method="post" class="text-left">
      <div class="mb-4">
        <label for="name" class="block text-gray-700">Name</label>
        <input type="text" id="name" name="name" class="w-full px-3 py-2 border border-gray-300 rounded-lg" 
               pattern="[^0-9]+" title="Name should not contain numbers." required>
      </div>
      <div class="mb-4">
        <input type="radio" id="tea" name="vote" value="tea">
        <label for="tea" class="ml-2">Tea</label>
      </div>
      <div class="mb-4">
        <input type="radio" id="coffee" name="vote" value="coffee">
        <label for="coffee" class="ml-2">Coffee</label>
      </div>
      <div class="mb-4">
        <input type="radio" id="milk" name="vote" value="milk">
        <label for="milk" class="ml-2">Milk</label>
      </div>
      <div class="flex justify-center mt-4">
        <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Vote</button>
      </div>
    </form>
  </div>

  <script>
    document.getElementById('pollForm').addEventListener('submit', function(event) {
      const tea = document.getElementById('tea').checked;
      const coffee = document.getElementById('coffee').checked;
      const milk = document.getElementById('milk').checked;
      if (!tea && !coffee && !milk) {
        event.preventDefault(); // Prevent form submission
        alert('Please select either Tea, Coffee, or Milk.');
      }
    });
  </script>
</body>
</html>




  `);
});

// Handle voting
// Handle voting
app.post('/vote', (req, res) => {
  const vote = req.body.vote;
  const name = req.body.name;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check if IP has already voted
  if (voters.some(voter => voter.ip === ip)) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Already Voted</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 class="text-2xl font-bold mb-4">You have already voted from this IP.</h1>
        </div>
      </body>
      </html>
    `);
  }

  if (vote === 'tea') votes.tea++;
  else if (vote === 'coffee') votes.coffee++;
  else if (vote === 'milk') votes.milk++;

  // Store voter information
  voters.push({ name, vote, ip });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thanks for Voting!</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 flex items-center justify-center min-h-screen">
      <div class="bg-white shadow-lg rounded-lg p-8 text-center max-w-md w-full">
        <h1 class="text-2xl font-semibold mb-4 text-gray-800">Thank You for Voting,<br> <span class="font-extrabold">${name}!</span></h1>
        <p class="text-gray-600 mb-6">You voted for <strong>${vote.charAt(0).toUpperCase() + vote.slice(1)}</strong>.</p>
        <div class="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 class="text-xl font-medium text-gray-700 mb-2">Total Count</h2>
          <p class="text-gray-800">Tea: <span class="font-semibold">${votes.tea}</span></p>
          <p class="text-gray-800">Coffee: <span class="font-semibold">${votes.coffee}</span></p>
          <p class="text-gray-800">Milk: <span class="font-semibold">${votes.milk}</span></p>
        </div>
        <a href="/admin" class="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">Admin</a>
      </div>
    </body>
    </html>
  `);
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
