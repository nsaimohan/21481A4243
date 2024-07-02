const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;

let numbersWindow = [];
let lastFetchedNumbers = [];

// Function to fetch numbers from the test server
async function fetchNumbers(numberType) {
    try {
        const response = await axios.get(`http://20.244.56.144/test/${numberType}`);
        if (response.status === 200) {
            return response.data.numbers || [];
        } else {
            console.error(`Failed to fetch numbers of type '${numberType}' from server.`);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching numbers: ${error.message}`);
        return [];
    }
}

// Function to calculate average of current window
function calculateAverage(window) {
    if (!window.length) {
        return 0;
    }
    const sum = window.reduce((acc, num) => acc + num, 0);
    return sum / window.length;
}

// Endpoint to handle requests
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    // Fetch numbers based on the numberid
    const fetchedNumbers = await fetchNumbers(numberid);

    // If fetching took more than 500ms, or no numbers were fetched, return last known state
    if (!fetchedNumbers.length) {
        return res.json({
            windowPrevState: numbersWindow,
            windowCurrState: numbersWindow,
            numbers: lastFetchedNumbers,
            avg: calculateAverage(numbersWindow)
        });
    }

    // Ensure uniqueness and add new numbers to the window
    fetchedNumbers.forEach(num => {
        if (!numbersWindow.includes(num)) {
            numbersWindow.push(num);
            if (numbersWindow.length > WINDOW_SIZE) {
                numbersWindow.shift(); // Maintain window size
            }
        }
    });

    // Update last fetched numbers
    lastFetchedNumbers = fetchedNumbers;

    // Respond with the updated state
    res.json({
        windowPrevState: numbersWindow,
        windowCurrState: numbersWindow,
        numbers: fetchedNumbers,
        avg: calculateAverage(numbersWindow)
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
