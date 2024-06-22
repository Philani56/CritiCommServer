const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

const app = express();
// const port = 3000; // or any port number you prefer

// Database configuration
const dbConfig = {
  user: 'criticomm',
  password: 'Netstream12@',
  server: 'criticomm.database.windows.net', 
  database: 'CRITICOMM',
  options: {
    encrypt: true, // Use this if you're on Windows Azure
  },
};

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to database
sql.connect(dbConfig, err => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// ------------------------------------------------l o g i n---------------------------------------------------------------------------

// API endpoint for user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const request = new sql.Request();
    const result = await request
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM respondenttable WHERE Email = @username AND Password = @password');
    
    if (result.recordset.length > 0) {
      res.json({ success: true, message: 'Login successful', user: result.recordset[0] });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.log('Query failed:', err);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// ------------------------------------------------I N C I D E N T S---------------------------------------------------------------------------

// API endpoint for fetching accidents
app.get('/accidents', async (req, res) => {
  // Check if the user is logged in (you can implement your own authentication logic here)
  // For demonstration purposes, let's assume a simple authentication check
  const loggedIn = true; // Assume the user is logged in
  
  if (!loggedIn) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const request = new sql.Request();
    const result = await request.query(`SELECT IncidentID, ResponderID, Date, Location, Category, Description FROM incidenttable WHERE responderid='0107115469085';`);
    
    res.json({ success: true, accidents: result.recordset });
  } catch (err) {
    console.log('Query failed:', err);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// ------------------------------------------------U S E R    L O C A T I O N---------------------------------------------------------------------------

// Endpoint to update user location
app.post('/update-location', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  try {
      const request = new sql.Request();

      if (latitude === null || longitude === null) {
          const result = await request
              .input('userId', sql.VarChar, userId)
              .query(`
                  UPDATE respondenttable
                  SET Location = NULL
                  WHERE ID = @userId
              `);
          res.json({ success: true, message: 'Location cleared successfully' });
      } else {
          const result = await request
              .input('userId', sql.VarChar, userId)
              .input('latitude', sql.Float, latitude)
              .input('longitude', sql.Float, longitude)
              .query(`
                  UPDATE respondenttable
                  SET Location = CAST(@latitude AS VARCHAR) + ',' + CAST(@longitude AS VARCHAR)
                  WHERE ID = @userId
              `);
          res.json({ success: true, message: 'Location updated successfully' });
      }
  } catch (err) {
      console.log('Query failed:', err);
      res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// --------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------------I N C I D E N T S---------------------------------------------------------

// Endpoint to handle saving case reports including image
app.post('/submit-data', async (req, res) => {
  const {
    // Existing fields
    patient_name, patient_last, date_of_birth, patient_age, sex, patient_weight, race, language,
    kin_first_name, kin_last_name, kin_contact_number, id_type, id_number, insurance_provider,
    insurance_policy_number, signs_symptoms, danger_to_self_or_others, health_at_risk, chief_complaint,
    mechanism_of_injury, nature_of_illness, presenting_problem, narrative, medications, medical_history,
    allergies, risk_of_harm, intervention, dosage, route, comment, transport_destination, transport_time,
    odometer_start, odometer_end, total_mileage, mileage_type, receiving_hospital, receiving_staff_first_name,
    receiving_staff_last_name, receiving_staff_title, referral, disposition, safety_plan, neuro_assessment,
    pain_score, signature_initials
  } = req.body;

  const { image_base64 } = req.body; // Base64-encoded image data from Android app

  try {
    const pool = await new ConnectionPool(config).connect(); // Connect to Azure SQL

    const request = pool.request();
    const result = await request.query(`
      INSERT INTO case_report (
        patient_name, patient_last, date_of_birth, patient_age, sex, patient_weight, race, language,
        kin_first_name, kin_last_name, kin_contact_number, id_type, id_number, insurance_provider,
        insurance_policy_number, signs_symptoms, danger_to_self_or_others, health_at_risk, chief_complaint,
        mechanism_of_injury, nature_of_illness, presenting_problem, narrative, medications, medical_history,
        allergies, risk_of_harm, intervention, dosage, route, comment, transport_destination, transport_time,
        odometer_start, odometer_end, total_mileage, mileage_type, receiving_hospital, receiving_staff_first_name,
        receiving_staff_last_name, receiving_staff_title, referral, disposition, safety_plan, neuro_assessment,
        pain_score, signature_initials, image_data
      ) VALUES (
        '${patient_name}', '${patient_last}', '${date_of_birth}', ${patient_age}, '${sex}', '${patient_weight}',
        '${race}', '${language}', '${kin_first_name}', '${kin_last_name}', '${kin_contact_number}', '${id_type}',
        '${id_number}', '${insurance_provider}', '${insurance_policy_number}', '${signs_symptoms}',
        ${danger_to_self_or_others}, ${health_at_risk}, '${chief_complaint}', '${mechanism_of_injury}',
        '${nature_of_illness}', '${presenting_problem}', '${narrative}', '${medications}', '${medical_history}',
        '${allergies}', '${risk_of_harm}', '${intervention}', '${dosage}', '${route}', '${comment}',
        '${transport_destination}', '${transport_time}', '${odometer_start}', '${odometer_end}', '${total_mileage}',
        '${mileage_type}', '${receiving_hospital}', '${receiving_staff_first_name}', '${receiving_staff_last_name}',
        '${receiving_staff_title}', '${referral}', '${disposition}', '${safety_plan}', '${neuro_assessment}',
        ${pain_score}, '${signature_initials}', '${image_base64}'  -- Insert Base64-encoded image data
      )
    `);
    
    console.log('Case report with image inserted into Azure SQL');
    res.status(200).send('Case report with image saved to Azure SQL');
  } catch (error) {
    console.error('Error inserting case report with image into Azure SQL:', error.message);
    res.status(500).send('Failed to insert case report with image into Azure SQL');
  }
});

const port = process.env.PORT || 3000; // Use environment variable for port if available
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  return 
});

