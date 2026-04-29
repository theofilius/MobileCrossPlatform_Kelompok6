const pool = require('../config/db');

exports.getOrCreateRoom = async (req, res) => {
  try {
    const { reportId } = req.params;

    let [rooms] = await pool.query('SELECT * FROM chat_rooms WHERE report_id = ?', [reportId]);

    if (rooms.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO chat_rooms (report_id, room_name) VALUES (?, ?)',
        [reportId, `Emergency Report #${reportId}`]
      );
      rooms = [{ id: result.insertId, report_id: reportId, room_name: `Emergency Report #${reportId}` }];
    }

    res.json({ room: rooms[0] });
  } catch (error) {
    console.error('GetOrCreateRoom error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [messages] = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.room_id = ?
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [roomId, parseInt(limit), parseInt(offset)]
    );

    res.json({ messages });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
