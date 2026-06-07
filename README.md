WhatsApp Appointment Reminder System

This is a simple web-based appointment booking system that automatically sends WhatsApp messages to customers when they book an appointment.

What This App Does

Users can fill in a form with a customer name, phone number, and appointment date and time. When the form is submitted, the appointment is saved to a database and a WhatsApp confirmation message is automatically sent to the customer. There is also a live dashboard that shows all the appointments that have been booked. As a bonus feature, the system automatically sends a reminder message one hour before the appointment is due.

Tools I Used

For the frontend I used plain HTML and Vanilla JavaScript. For the backend I used Node.js with Express. The database is Supabase which runs on PostgreSQL. For sending WhatsApp messages I used the Twilio API. For the automatic reminder I used a node-cron job that runs every minute in the background.

How the Data Flows

When a user submits the form, the frontend sends the data to the backend. The backend saves the appointment into Supabase and then immediately calls the Twilio API to send a WhatsApp confirmation to the customer. The dashboard loads all appointments directly from the database and refreshes every 30 seconds. The cron job checks every minute if any appointment is happening within the next hour and sends a reminder if it has not been sent yet.

How to Run This Project

First go into the backend folder and run npm install to install all the packages. Then create a file called .env and add your Supabase and Twilio credentials. Then run node server.js to start the backend. Finally open the frontend index.html file in your browser.

