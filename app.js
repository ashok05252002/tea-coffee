const express = require('express');
const session = require('express-session');
const app = express();
const port = 8080;
const path = require('path');

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
let results = [];
const fs = require('fs');



// Poll page
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tea or Coffee Poll</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      body {
        background-image: url('https://png.pngtree.com/background/20210710/original/pngtree-coffee-biscuit-western-afternoon-tea-literary-banner-picture-image_1024577.jpg');
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
          <select id="name" name="name" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
            <option value="">Select a name...</option>
          </select>
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
          <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Vote</button>
        </div>
      </form>
    </div>

    <script>
      // Fetch names from the names.json file and populate the dropdown
      fetch('/names.json')
        .then(response => response.json())
        .then(data => {
          const nameSelect = document.getElementById('name');
          data.names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            nameSelect.appendChild(option);
          });
        });

      // Form validation to ensure a name is selected
      document.getElementById('pollForm').addEventListener('submit', function(event) {
        const nameSelect = document.getElementById('name');
        const tea = document.getElementById('tea').checked;
        const coffee = document.getElementById('coffee').checked;
        const milk = document.getElementById('milk').checked;
        if (!tea && !coffee && !milk) {
          event.preventDefault(); // Prevent form submission
          alert('Please select either Tea, Coffee, or Milk.');
        }
        if (!nameSelect.value) {
          event.preventDefault(); // Prevent form submission
          alert('Please select a name from the list.');
        }
      });
    </script>
  </body>
  </html>
  `);
});

// Serve the names.json file
app.get('/names.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'names.json'));
});

// Handle vote submission
app.post('/vote', (req, res) => {
  const { vote, name } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check if the name has already voted, excluding "Guest"
  if (name !== 'Guest' && voters.find(voter => voter.name === name)) {
    return res.send('This name has already submitted a vote. Please use a different name.');
  }

  // Increment vote count based on the vote
  if (vote === 'tea') votes.tea++;
  else if (vote === 'coffee') votes.coffee++;
  else if (vote === 'milk') votes.milk++;

  // Store voter information
  voters.push({ name, vote, ip });

  // Store result in session and redirect to thank you page
  req.session.result = { name, vote, votes };
  res.redirect('/thank-you');
});

app.get('/thank-you', (req, res) => {
  const result = req.session.result;

  if (!result) {
    return res.redirect('/');
  }

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
        <h1 class="text-2xl font-semibold mb-4 text-gray-800">Thanks for your input!,<br> <span class="font-extrabold">${result.name}!</span></h1>
        <p class="text-gray-600 mb-6">You selected <strong>${result.vote.charAt(0).toUpperCase() + result.vote.slice(1)}</strong>.</p>
        <div class="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 class="text-xl font-medium text-gray-700 mb-2">Total Count</h2>
          <p class="text-gray-800">Tea: <span class="font-semibold">${result.votes.tea}</span></p>
          <p class="text-gray-800">Coffee: <span class="font-semibold">${result.votes.coffee}</span></p>
          <p class="text-gray-800">Milk: <span class="font-semibold">${result.votes.milk}</span></p>
        </div>
        <a href="/" class="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">Back to Poll</a>
      </div>
    </body>
    </html>
  `);

  // Clear the session after displaying the result
  req.session.result = null;
});

// Admin page
app.get('/superadmin', (req, res) => {
  const namesFilePath = path.join(__dirname, 'names.json');
  const namesData = JSON.parse(fs.readFileSync(namesFilePath, 'utf8'));
  const namesList = namesData.names;

  // Example data for voters (replace this with actual data retrieval logic)

  // Extract names from the voters array
  const voterNames = new Set(voters.map(voter => voter.name));

  // Find names in namesList that are not in the voterNames set
  const missingNames = namesList.filter(name => !voterNames.has(name));

  res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Poll Results</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 flex">

  <!-- Sidebar -->
<aside class="w-64 bg-gray-800 text-white h-screen flex flex-col fixed">
    <div class="p-4 text-2xl font-bold text-center border-b border-gray-700">Pro Order</div>
    <nav class="flex-1 p-4">
      <ul class="space-y-4">
        <li>
          <a href="/superadmin" class="block py-2 px-4 rounded bg-gray-700">Dashboard</a>
        </li>
        <li>
          <a href="/voter-detail" class="block py-2 px-4 rounded hover:bg-gray-700">Voter Details</a>
        </li>
        <li>
          <a href="/data" class="block py-2 px-4 rounded hover:bg-gray-700">Order History</a>
        </li>
        <li>
          <a href="/add-name" class="block py-2 px-4 rounded hover:bg-gray-700">Add User</a>
        </li>
        <li>
          <a href="#" class="block py-2 px-4 rounded hover:bg-gray-700">Settings</a>
        </li>
      </ul>
    </nav>
    <div class="p-4 border-t border-gray-700">
      <button class="w-full bg-red-500 py-2 px-4 rounded hover:bg-red-600">Logout</button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white shadow p-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Poll Results</h1>
      <div class="space-x-4">
      <form action="/store" method="post" class="inline">
        <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Store Data</button>
        </form>
        <button class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600">Refresh</button>
         <form action="/reset" method="post" class="inline">
        <button class="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Reset Votes</button>
        </form>
      </div>
    </header>

    <!-- Content Section -->
    <main class="p-6 flex-1 overflow-y-auto ml-80">
      <div class="bg-white p-8 rounded-lg shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Poll Details Table -->
        <div>
          <h2 class="text-xl font-bold mb-4 text-gray-800">Poll Details</h2>
          <table class="w-full text-left mb-6">
            <thead>
              <tr>
                <th class="py-2 px-4 bg-blue-100 text-blue-700 font-semibold">Option</th>
                <th class="py-2 px-4 bg-blue-100 text-blue-700 font-semibold">Votes</th>
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
        </div>

        <!-- Names Not Found in Voters List -->
        <div>
          <h2 class="text-xl font-bold mb-4 text-gray-800">Names Not Found in Voters List</h2>
          <table class="w-full text-left mb-6">
            <thead>
              <tr>
                <th class="py-2 px-4 bg-blue-100 text-blue-700 font-semibold">Names</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t">
                <td class="py-2 px-4">
                  <ul class="list-disc list-inside">
                    ${missingNames.map(name => `<li>${name}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>
  </div>
  <script>
    setTimeout(function(){
      location.reload();
    }, 10000); // 10000 milliseconds = 10 seconds
  </script>
</body>
</html>
  `);
});
app.get('/voter-detail', (req, res) => {
  // Read and parse names.json file
  const namesFilePath = path.join(__dirname, 'names.json');
  const namesData = JSON.parse(fs.readFileSync(namesFilePath, 'utf8'));
  const namesList = namesData.names;

  // Example data for voters (replace this with actual data retrieval logic)

  // Extract names from the voters array
  const voterNames = new Set(voters.map(voter => voter.name));

  // Find names in namesList that are not in the voterNames set
  const missingNames = namesList.filter(name => !voterNames.has(name));

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Poll Results</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 flex">
<!-- Sidebar -->
<aside class="w-64 bg-gray-800 text-white h-screen flex flex-col fixed">
    <div class="p-4 text-2xl font-bold text-center border-b border-gray-700">Pro Order</div>
    <nav class="flex-1 p-4">
      <ul class="space-y-4">
        <li>
          <a href="/superadmin" class="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</a>
        </li>
        <li>
          <a href="/voter-detail" class="block py-2 px-4 rounded bg-gray-700">Voter Details</a>
        </li>
        <li>
          <a href="/data" class="block py-2 px-4 rounded hover:bg-gray-700">Order History</a>
        </li>
        <li>
          <a href="/add-name" class="block py-2 px-4 rounded hover:bg-gray-700">Add User</a>
        </li>
        <li>
          <a href="#" class="block py-2 px-4 rounded hover:bg-gray-700">Settings</a>
        </li>
        </ul>
    </nav>
    <div class="p-4 border-t border-gray-700">
      <button class="w-full bg-red-500 py-2 px-4 rounded hover:bg-red-600">Logout</button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white shadow p-4 pl-80 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">....</h1>
      
    </header>
    <main class="p-6 flex-1 pl-80 overflow-y-auto">
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
      <h2 class="text-xl font-bold mt-6 mb-4 text-gray-800">Names Not Found in Voters List</h2>
      <ul class="list-disc ml-6">
        ${missingNames.map(name => `<li>${name}</li>`).join('')}
      </ul>
    </main>
  </div>
  </body>
</html>
  `;

  // Send the HTML response
  res.send(htmlContent);
});

// Reset votes route
app.post('/reset', (req, res) => {
  votes = { tea: 0, coffee: 0, milk: 0 };
  voters = [];
  res.redirect('/superadmin');
});

// Store data route
app.post('/store', (req, res) => {
  const currentTime = new Date().toISOString();
  const data = { time: currentTime, votes };

  fs.appendFile('data.json', JSON.stringify(data, null, 2) + ',\n', (err) => {
    if (err) {
      console.error('Error writing to data.json:', err);
      return res.status(500).send('Error storing data');
    }
    res.redirect('/superadmin');
  });
});

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

// Data page with Delete and Edit options
app.get('/data', (req, res) => {
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).send('Error reading data');
    }

    let storedData;
    try {
      storedData = JSON.parse('[' + data.slice(0, -2) + ']'); // Remove last comma and wrap in brackets
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      return res.status(500).send('Error parsing data');
    }

    res.send(`
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Table - Poll Results</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 flex min-h-screen">
  <!-- Sidebar -->
<aside class="w-64 bg-gray-800 text-white h-screen flex flex-col z-20 fixed">
    <div class="p-4 text-2xl font-bold text-center border-b border-gray-700">Pro Order</div>
    <nav class="flex-1 p-4">
      <ul class="space-y-4">
        <li>
          <a href="/superadmin" class="block py-2 px-4 rounded">Dashboard</a>
        </li>
        <li>
          <a href="/voter-detail" class="block py-2 px-4 rounded hover:bg-gray-700">Voter Details</a>
        </li>
        <li>
          <a href="/data" class="block py-2 px-4 rounded bg-gray-700">Order History</a>
        </li>
        <li>
          <a href="/add-name" class="block py-2 px-4 rounded hover:bg-gray-700">Add User</a>
        </li>
        <li>
          <a href="#" class="block py-2 px-4 rounded hover:bg-gray-700">Settings</a>
        </li>
      </ul>
    </nav>
    <div class="p-4 border-t border-gray-700">
      <button class="w-full bg-red-500 py-2 px-4 rounded hover:bg-red-600">Logout</button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white shadow pl-80 p-4 flex justify-between items-center sticky top-0 z-10">
      <h1 class="text-2xl font-bold text-gray-800">Poll Results</h1>
      
    </header>

    <!-- Content -->
    <div class="bg-white p-8 md:ml-80 rounded-lg shadow-lg max-w-4xl w-full mt-4">
  <h1 class="text-2xl font-bold mb-6 text-gray-800">Stored ....</h1>

  <!-- Container for responsive table -->
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Time</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Tea</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Coffee</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Milk</th>
          <th class="py-2 px-4 bg-green-100 text-green-700 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${storedData.map((entry, index) => `
        <tr class="border-t">
          <td class="py-2 px-4">${new Date(entry.time).toLocaleString()}</td>
          <td class="py-2 px-4">${entry.votes.tea}</td>
          <td class="py-2 px-4">${entry.votes.coffee}</td>
          <td class="py-2 px-4">${entry.votes.milk}</td>
          <td class="py-2 px-4">
            <form action="/delete/${index}" method="post" class="inline">
              <button type="submit" class="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600">Delete</button>
            </form>
            <button onclick="showEditModal(${index}, '${entry.votes.tea}', '${entry.votes.coffee}', '${entry.votes.milk}')" class="bg-yellow-500 text-white py-1 px-3 rounded-lg hover:bg-yellow-600 ml-2">Edit</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="mt-4 flex flex-col sm:flex-row">
    <a href="/superadmin" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mb-2 sm:mb-0 sm:mr-2">Back to Admin</a>
    <button onclick="showAddModal()" class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Add New</button>
  </div>
</div>

  </div>

  <!-- Add Modal -->
  <div id="addModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 hidden">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Add New Poll Entry</h2>
      <form id="addForm" action="/add" method="post" onsubmit="return validateForm()">
        <div class="mb-4">
          <label class="block text-gray-700">Tea Votes</label>
          <input type="number" name="tea" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Coffee Votes</label>
          <input type="number" name="coffee" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Milk Votes</label>
          <input type="number" name="milk" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="flex justify-end">
          <button type="button" onclick="hideAddModal()" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 mr-2">Cancel</button>
          <button type="submit" class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Add</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Modal -->
  <div id="editModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 hidden">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Edit Poll Entry</h2>
      <form id="editForm" action="" method="post" onsubmit="return validateForm()">
        <div class="mb-4">
          <label class="block text-gray-700">Tea Votes</label>
          <input type="number" id="editTea" name="tea" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Coffee Votes</label>
          <input type="number" id="editCoffee" name="coffee" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Milk Votes</label>
          <input type="number" id="editMilk" name="milk" class="w-full border border-black rounded-lg p-2 mt-1 focus:border-black" min="0" max="99" required>
        </div>
        <div class="flex justify-end">
          <button type="button" onclick="hideEditModal()" class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 mr-2">Cancel</button>
          <button type="submit" class="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showAddModal() {
      document.getElementById('addModal').classList.remove('hidden');
    }

    function hideAddModal() {
      document.getElementById('addModal').classList.add('hidden');
    }

    function showEditModal(index, tea, coffee, milk) {
      const form = document.getElementById('editForm');
      form.action = '/edit/' + index;
      document.getElementById('editTea').value = tea;
      document.getElementById('editCoffee').value = coffee;
      document.getElementById('editMilk').value = milk;
      document.getElementById('editModal').classList.remove('hidden');
    }

    function hideEditModal() {
      document.getElementById('editModal').classList.add('hidden');
    }
  </script>
</body>
</html>

    `);
  });
});

// Handle delete
app.post('/delete/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);

  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).send('Error reading data');
    }

    let storedData = JSON.parse('[' + data.slice(0, -2) + ']'); // Remove last comma and wrap in brackets
    storedData.splice(index, 1);

    const updatedData = storedData.map(entry => JSON.stringify(entry) + ',\n').join('');
    fs.writeFile('data.json', updatedData, (writeErr) => {
      if (writeErr) {
        console.error('Error writing to data.json:', writeErr);
        return res.status(500).send('Error writing data');
      }

      res.redirect('/data');
    });
  });
});

// Handle add
app.post('/add', (req, res) => {
  const { tea, coffee, milk } = req.body;
  const newEntry = {
    time: new Date().toISOString(),
    votes: {
      tea: parseInt(tea, 10),
      coffee: parseInt(coffee, 10),
      milk: parseInt(milk, 10)
    }
  };

  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).send('Error reading data');
    }

    let storedData;
    try {
      storedData = JSON.parse('[' + data.slice(0, -2) + ']'); // Remove last comma and wrap in brackets
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      return res.status(500).send('Error parsing data');
    }

    storedData.push(newEntry);

    const updatedData = storedData.map(entry => JSON.stringify(entry) + ',\n').join('');
    fs.writeFile('data.json', updatedData, (writeErr) => {
      if (writeErr) {
        console.error('Error writing to data.json:', writeErr);
        return res.status(500).send('Error writing data');
      }

      res.redirect('/data');
    });
  });
});

// Handle edit
app.post('/edit/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { tea, coffee, milk } = req.body;

  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).send('Error reading data');
    }

    let storedData = JSON.parse('[' + data.slice(0, -2) + ']'); // Remove last comma and wrap in brackets
    storedData[index].votes.tea = parseInt(tea, 10);
    storedData[index].votes.coffee = parseInt(coffee, 10);
    storedData[index].votes.milk = parseInt(milk, 10);

    const updatedData = storedData.map(entry => JSON.stringify(entry) + ',\n').join('');
    fs.writeFile('data.json', updatedData, (writeErr) => {
      if (writeErr) {
        console.error('Error writing to data.json:', writeErr);
        return res.status(500).send('Error writing data');
      }

      res.redirect('/data');
    });
  });
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
app.get('/manualorder', (req, res) => {
  res.send(`
 <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual Order</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    .background-image {
      background-image: url('https://images.unsplash.com/photo-1529229089-f5719a804879?q=80&w=1536&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
      background-size: cover;
      background-position: center;
    }
  </style>
</head>
<body class="background-image bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="bg-white bg-opacity-90 p-8 md:p-10 rounded-2xl shadow-2xl max-w-md w-full mx-4 flex items-center justify-center transform transition duration-300 hover:scale-105 hover:shadow-3xl">
    <div class="w-full">
      <h1 class="text-3xl font-extrabold mb-6 text-gray-800 text-center">Manual Order</h1>
      <form id="manualOrderForm" action="/manualorder" method="post" class="space-y-6">
        <div class="flex flex-col items-center">
          <label class="block text-gray-700 font-semibold mb-2">Tea</label>
          <div class="flex items-center">
            <button type="button" onclick="updateCount('tea', -1)" class="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200">-</button>
            <input id="tea" name="tea" type="number" value="0" class="mx-2 w-16 text-center border border-gray-300 rounded-lg" readonly>
            <button type="button" onclick="updateCount('tea', 1)" class="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-200">+</button>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <label class="block text-gray-700 font-semibold mb-2">Coffee</label>
          <div class="flex items-center">
            <button type="button" onclick="updateCount('coffee', -1)" class="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200">-</button>
            <input id="coffee" name="coffee" type="number" value="0" class="mx-2 w-16 text-center border border-gray-300 rounded-lg" readonly>
            <button type="button" onclick="updateCount('coffee', 1)" class="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-200">+</button>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <label class="block text-gray-700 font-semibold mb-2">Milk</label>
          <div class="flex items-center">
            <button type="button" onclick="updateCount('milk', -1)" class="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200">-</button>
            <input id="milk" name="milk" type="number" value="0" class="mx-2 w-16 text-center border border-gray-300 rounded-lg" readonly>
            <button type="button" onclick="updateCount('milk', 1)" class="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-200">+</button>
          </div>
        </div>
        <div class="flex justify-center mt-6">
          <button type="submit" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-full shadow-md hover:from-blue-600 hover:to-blue-700 transform transition duration-200 hover:scale-105">Submit</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal -->
  <div id="confirmationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full">
      <h2 class="text-lg font-bold mb-4">Confirm Order</h2>
      <p class="mb-6">Are you sure you want to submit the order?</p>
      <div class="flex justify-end space-x-4">
        <button id="cancelButton" class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded">Cancel</button>
        <button id="confirmButton" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">Confirm</button>
      </div>
    </div>
  </div>

  <script>
    function updateCount(id, amount) {
      const input = document.getElementById(id);
      let value = parseInt(input.value, 10) + amount;
      if (value < 0) value = 0; // Prevent negative values
      input.value = value;
    }

    document.getElementById('manualOrderForm').addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent default form submission
      document.getElementById('confirmationModal').classList.remove('hidden'); // Show the modal
    });

    document.getElementById('cancelButton').addEventListener('click', function() {
      document.getElementById('confirmationModal').classList.add('hidden'); // Hide the modal
    });

    document.getElementById('confirmButton').addEventListener('click', function() {
      document.getElementById('manualOrderForm').submit(); // Submit the form
    });
  </script>
</body>
</html>



  `);
});

// Handle manual order submissions and store the results in data.json
app.post('/manualorder', (req, res) => {
  const { tea, coffee, milk } = req.body;

  // Create an entry for the order
  const order = {
    time: new Date().toISOString(),
    votes: {
      tea: parseInt(tea, 10),
      coffee: parseInt(coffee, 10),
      milk: parseInt(milk, 10)
    }
  };

  // Read existing data from data.json
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).send('Error reading data file.');
    }

    // Parse existing data or initialize an empty array
    const existingData = data ? JSON.parse(`[${data.trim().replace(/,$/, '')}]`) : [];

    // Add new order to existing data
    existingData.push(order);

    // Format data with newline after each entry
    const formattedData = existingData.map(entry => JSON.stringify(entry)).join(',\n') + ',\n';

    // Write updated data back to data.json
    fs.writeFile('data.json', formattedData, 'utf8', (err) => {
      if (err) {
        return res.status(500).send('Error writing to data file.');
      }
      res.redirect('/manualorder'); // Redirect back to the form
    });
  });
});


app.get('/add-name', (req, res) => {
  const namesFilePath = path.join(__dirname, 'names.json');

  fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading names.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const namesData = JSON.parse(data);

    // Render the HTML with the list of names
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add Name</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 min-h-screen flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-gray-800 text-white h-screen flex flex-col fixed z-20">
          <div class="p-4 text-2xl font-bold text-center border-b border-gray-700">Pro Order</div>
          <nav class="flex-1 p-4">
            <ul class="space-y-4">
              <li><a href="/superadmin" class="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</a></li>
              <li><a href="/voter-detail" class="block py-2 px-4 rounded hover:bg-gray-700">Voter Details</a></li>
              <li><a href="/data" class="block py-2 px-4 rounded hover:bg-gray-700">Order History</a></li>
              <li><a href="/add-name" class="block py-2 px-4 rounded bg-gray-700">Add User</a></li>
              <li><a href="#" class="block py-2 px-4 rounded hover:bg-gray-700">Settings</a></li>
            </ul>
          </nav>
          <div class="p-4 border-t border-gray-700">
            <button class="w-full bg-red-500 py-2 px-4 rounded hover:bg-red-600">Logout</button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col ml-64">
          <!-- Top Bar -->
          <header class="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
            <h1 class="text-2xl font-bold text-gray-800">Poll Results</h1>
          </header>

          <!-- Content Section -->
          <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center mx-auto mt-8">
            <h1 class="text-2xl font-bold mb-4">Add a Name</h1>
            <form action="/add-name" method="post" class="text-left mb-4">
              <div class="mb-4">
                <label for="newName" class="block text-gray-700">Name</label>
                <input type="text" id="newName" name="newName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                       pattern="^[A-Za-z ]{3,20}$" title="Name should contain 3 to 20 letters, including spaces, without any numbers or special characters." 
                       maxlength="20" required>
              </div>
              <div class="flex justify-center mt-4">
                <button type="submit" class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Add Name</button>
              </div>
            </form>
            <form action="/sort-names" method="post" class="text-left mb-4">
              <div class="flex justify-center mt-4">
                <button type="submit" class="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600">Sort Names Alphabetically</button>
              </div>
            </form>
            <a href="/" class="text-blue-500 hover:underline mt-4 block">Back to Poll</a>

            <!-- List of Names with Edit and Delete options -->
            <h2 class="text-xl font-bold mt-8">Names List</h2>
            <ul class="text-left mt-4 space-y-2">
              ${namesData.names.map((name, index) => `
                <li class="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
                  <span>${name}</span>
                  <div class="flex space-x-2">
                    <form action="/delete-name/${index}" method="post">
                      <button type="submit" class="text-red-500 hover:underline">Delete</button>
                    </form>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

// POST route to add a new name
app.post('/add-name', (req, res) => {
  const newName = req.body.newName;
  const namesFilePath = path.join(__dirname, 'names.json');

  fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading names.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const namesData = JSON.parse(data);
    namesData.names.push(newName); // Add the new name to the list

    fs.writeFile(namesFilePath, JSON.stringify(namesData, null, 2), (err) => {
      if (err) {
        console.error('Error writing to names.json:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect('/add-name'); // Redirect back to the add name page
    });
  });
});

// POST route to delete a name
app.post('/delete-name/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  const namesFilePath = path.join(__dirname, 'names.json');

  fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading names.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const namesData = JSON.parse(data);
    if (index >= 0 && index < namesData.names.length) {
      namesData.names.splice(index, 1); // Remove the name at the specified index
      fs.writeFile(namesFilePath, JSON.stringify(namesData, null, 2), (err) => {
        if (err) {
          console.error('Error writing to names.json:', err);
          return res.status(500).send('Internal Server Error');
        }
        res.redirect('/add-name'); // Redirect back to the add name page
      });
    } else {
      res.status(400).send('Invalid name index. <a href="/add-name">Go back</a>');
    }
  });
});

// Handle sorting names alphabetically
app.post('/sort-names', (req, res) => {
  const namesFilePath = path.join(__dirname, 'names.json');

  // Read the current names from the JSON file
  fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading names.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const namesData = JSON.parse(data);
    namesData.names.sort(); // Sort the names alphabetically
    fs.writeFile(namesFilePath, JSON.stringify(namesData, null, 2), (err) => {
      if (err) {
        console.error('Error writing to names.json:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect('/add-name'); // Redirect back to the add name page
    });
  });
});
// Serve the names.json file
app.get('/names.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'names.json')); // Serve the names.json file
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
