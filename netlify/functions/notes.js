const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path, body } = event;
    
    // Parse the path to get note ID if present
    const pathParts = path.split('/');
    const noteId = pathParts[pathParts.length - 1];
    const isSpecificNote = pathParts.length > 3 && noteId !== 'notes';

    switch (httpMethod) {
      case 'GET':
        if (isSpecificNote) {
          // Get specific note
          const result = await sql`SELECT * FROM notes WHERE id = ${noteId}`;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result }),
          };
        } else {
          // Get all notes
          const result = await sql`SELECT * FROM notes ORDER BY created_at ASC`;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: result }),
          };
        }

      case 'POST':
        const createData = JSON.parse(body);
        const insertResult = await sql`
          INSERT INTO notes (content, x_position, y_position, color, created_at, updated_at)
          VALUES (${createData.content || ''}, ${createData.x_position || 0}, ${createData.y_position || 0}, ${createData.color || 'yellow'}, ${new Date().toISOString()}, ${new Date().toISOString()})
          RETURNING *
        `;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: insertResult }),
        };

      case 'PUT':
        if (!isSpecificNote) {
          return {
            statusCode: 400,
            headers,
            body: 