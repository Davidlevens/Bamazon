// Required Dependencies
const mysql = require("mysql");
// const mysql = require('promise-mysql');
const inquirer = require("inquirer");
const colors = require('colors');
const Table = require('cli-table');
const conf = require('./config.js');




const connection = mysql.createConnection(conf)

connection.connect(async function (err) {
    if (err) throw err;
    console.log(colors.cyan("Welcome! ...you are now connected to the Bamazon Store database as id " + connection.threadId));
    //connection.end();
    
    
    const carryOn = await inquirer.prompt([
        {
            message: "Please hit 'Enter' to view inventory".yellow,
            name: "go",
        }
    ]);


  
    bamazon();      //Call main function


       

});                 // End Connection Script

// BEGIN Display Inventory
function bamazon() {
    connection.query('SELECT * FROM products', function (err, res) {
        if (err) throw err;

        // Cli-Table display code with Color
        const table = new Table(
            {
                head: ["Product ID".cyan.bold, "Product Name".cyan.bold, "Department Name".cyan.bold, "Price".cyan.bold, "Quantity".cyan.bold],
                colWidths: [12, 75, 20, 12, 12],
            });

        // Set/Style table headings and Loop through entire inventory
        for (let i = 0; i < res.length; i++) {
            table.push(
                [res[i].id, res[i].product_name, res[i].department_name, parseFloat(res[i].price).toFixed(2), res[i].stock_quantity]
            );
        }

        console.log(table.toString());
        // END Display Inventory

        // Prompt Customers Input
        inquirer.prompt([
            {
                type: "number",
                message: "Please enter the Product ID of the item that you would like to buy?".yellow,
                name: "id",
                validate: function(value){
                    var valid = value.toString().match(/^[0-9]+$/);
                    if(valid){
                        return true
                    }
                        return 'Please enter a valid Product ID'
                }
            },
            {
                type: "number",
                message: "How many would you like to buy?".yellow,
                name: "quantity",
                validate: function(value){
                    var valid = value.toString().match(/^[0-9]+$/)
                    if(valid){
                        return true
                    }
                        return 'Please enter a numerical value'
                }
            },
        ])

            // Ordering function
            .then(function (cart) {

                const quantity = cart.quantity;
                const itemID = cart.id;

                connection.query('SELECT * FROM products WHERE id=' + itemID, function (err, selectedItem) {
                    if (err) throw err;

                    // Varify item quantity desired is in inventory
                    if (selectedItem[0].stock_quantity - quantity >= 0) {

                        console.log("INVENTORY AUDIT: Quantity in Stock: ".green + selectedItem[0].stock_quantity + " Order Quantity: ".green + quantity);

                        console.log("Congratulations! Bamazon has suffiecient inventory of ".green + selectedItem[0].product_name.yellow + " to fill your order!".green);

                       

                        // Calculate total sale, and fix 2 decimal places
                        console.log("Thank You for your purchase. Your order total will be ".green + (cart.quantity * selectedItem[0].price).toFixed(2).yellow + " dollars.".green, "\nThank you for shopping at Bamazon!".magenta);

                        // Query to remove the purchased item from inventory.                       
                        connection.query('UPDATE products SET stock_quantity=? WHERE id=?', [selectedItem[0].stock_quantity - quantity, itemID],

                            function (err, inventory) {
                                if (err) throw err;

                                setTimeout(function() {
                                    bamazon();
                                   }, 5000);  // Runs the prompt again, so the customer can continue shopping.
                            });  // Ends the code to remove item from inventory.

                    }
                    // Low inventory warning
                    else {
                        console.log("INSUFFICIENT INVENTORY ALERT: \nBamazon only has ".red + selectedItem[0].stock_quantity + " " + selectedItem[0].product_name.cyan + " in stock at this moment. \nPlease make another selection or reduce your quantity.".red, "\nThank you for shopping at Bamazon!".magenta);

                        setTimeout(function() {
                            bamazon();
                           }, 5000);  // Runs the prompt again, so the customer can continue shopping.
                    }
                });
            });
    });
}   // Closes bamazon function
