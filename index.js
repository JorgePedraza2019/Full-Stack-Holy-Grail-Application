// run: docker run -p 6379:6379 --name some-redis -d redis:3.0.2
var express = require("express");
var app = express();
var redis = require("redis");
var client = redis.createClient();

// serve static files from the public directory
app.use(express.static("public"));

// Initialize values using multi
client.multi()
  .set("header", 0)
  .set("left", 0)
  .set("article", 0)
  .set("right", 0)
  .set("footer", 0)
  .exec(function (err, replies) {
    if (err) {
      console.error("Error setting initial values:", err);
    } else {
      console.log("Initial values set successfully.");
    }
  });

function data() {
  return new Promise((resolve, reject) => {
    client.mget(
      "header", "left", "article", "right", "footer",
      function (err, value) {
        const data = {
          header: Number(value[0]),
          left: Number(value[1]),
          article: Number(value[2]),
          right: Number(value[3]),
          footer: Number(value[4]),
        };
        err ? reject(err) : resolve(data);
      }
    );
  });
}

// Get key data
app.get("/data", function (req, res) {
  data().then((data) => {
    console.log(data);
    res.send(data);
  });
});

// Update key values
app.get("/update/:key/:value", function (req, res) {
  const key = req.params.key;
  let value = Number(req.params.value);

  client.get(key, function (err, reply) {
    // New value
    value = Number(reply) + value;
    
    // Set the updated value
    client.set(key, value);

    // Return updated data to the client
    data().then((data) => {
      console.log(data);
      res.send(data);
    });
  });
});

// Before the process exits
process.on('exit', (code) => {
  // Close the Redis client gracefully
  client.quit();
  console.log(`About to exit with code: ${code}`);
});

// Start the Express app
app.listen(3000, () => {
  console.log("Running on 3000");
});
