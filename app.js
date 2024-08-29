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
const fs = require('fs'); // Require the fs module for file operations

// Admin page
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
      <form action="/store" method="post" class="inline">
        <button type="submit" class="ml-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Store Data</button>
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
  res.redirect('/admin');
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
    res.redirect('/admin');
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
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
  <div class="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">Stored Poll Results</h1>
    
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

    <div class="mt-4">
      <a href="/admin" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Back to Admin</a>
      <button onclick="showAddModal()" class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 ml-2">Add New</button>
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
    function validateForm() {
      const tea = document.querySelector('input[name="tea"]').value;
      const coffee = document.querySelector('input[name="coffee"]').value;
      const milk = document.querySelector('input[name="milk"]').value;
      
      if (tea > 99 || coffee > 99 || milk > 99) {
        alert('Votes cannot exceed 99.');
        return false;
      }
      return true;
    }

    function showAddModal() {
      document.getElementById('addModal').classList.remove('hidden');
    }

    function hideAddModal() {
      document.getElementById('addModal').classList.add('hidden');
    }

    function showEditModal(index, tea, coffee, milk) {
      document.getElementById('editTea').value = tea;
      document.getElementById('editCoffee').value = coffee;
      document.getElementById('editMilk').value = milk;
      document.getElementById('editForm').action = '/edit/' + index;
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



// Poll page
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
        <input type="text" id="name" name="name" class="w-full px-3 py-2 border border-gray-300 rounded-lg" 
               pattern="^[A-Za-z ]{3,20}$" title="Name should contain 3 to 20 letters, including spaces, without any numbers or special characters." 
               maxlength="20" required>
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
<form action="/reset" method="post">
    <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">Vote</button>
  </form>      </div>
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

app.post('/vote', (req, res) => {
  const vote = req.body.vote;
  const name = req.body.name;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
