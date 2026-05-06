const pool = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const { type, description, latitude, longitude, address, is_urgent } = req.body;
    const userId = req.userId;

    if (!type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Type, latitude, and longitude are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO reports (user_id, type, description, latitude, longitude, address, is_urgent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, description || null, latitude, longitude, address || null, is_urgent || false]
    );

    // Auto-create a chat room for this report
    await pool.query(
      'INSERT INTO chat_rooms (report_id, room_name) VALUES (?, ?)',
      [result.insertId, `Emergency Report #${result.insertId}`]
    );

    // Simulate responder dispatch
    const [volunteers] = await pool.query(
      `SELECT id FROM users WHERE is_volunteer = TRUE AND id != ? LIMIT 1`,
      [userId]
    );

    if (volunteers.length > 0) {
      await pool.query(
        `INSERT INTO responders (user_id, report_id, latitude, longitude)
         VALUES (?, ?, ?, ?)`,
        [volunteers[0].id, result.insertId, latitude + 0.005, longitude + 0.003]
      );
    }

    res.status(201).json({
      message: 'Report created successfully',
      report: { id: result.insertId, type, status: 'pending', is_urgent },
    });
  } catch (error) {
    console.error('CreateReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.name AS reporter_name, u.avatar_url AS reporter_avatar,
        (SELECT COUNT(*) FROM report_media rm WHERE rm.report_id = r.id) AS media_count
      FROM reports r
      JOIN users u ON r.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('r.type = ?');
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [reports] = await pool.query(query, params);
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM reports');

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
      },
    });
  } catch (error) {
    console.error('GetReports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await pool.query(
      `SELECT r.*, u.name AS reporter_name, u.avatar_url AS reporter_avatar, u.phone AS reporter_phone
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const [media] = await pool.query(
      'SELECT * FROM report_media WHERE report_id = ?',
      [id]
    );

    const [chatRooms] = await pool.query(
      'SELECT * FROM chat_rooms WHERE report_id = ?',
      [id]
    );

    const [responders] = await pool.query(
      `SELECT resp.*, u.name AS responder_name
       FROM responders resp
       JOIN users u ON resp.user_id = u.id
       WHERE resp.report_id = ?`,
      [id]
    );

    res.json({
      report: { ...reports[0], media, chat_room: chatRooms[0] || null, responders },
    });
  } catch (error) {
    console.error('GetReportById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Report status updated', status });
  } catch (error) {
    console.error('UpdateReportStatus error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const mediaEntries = req.files.map((file) => {
      let media_type = 'photo';
      if (file.mimetype.startsWith('video/')) media_type = 'video';
      else if (file.mimetype.startsWith('audio/')) media_type = 'audio';

      return {
        report_id: id,
        media_type,
        file_url: `/uploads/${media_type === 'photo' ? 'photos' : media_type === 'video' ? 'videos' : 'audio'}/${file.filename}`,
      };
    });

    for (const entry of mediaEntries) {
      await pool.query(
        'INSERT INTO report_media (report_id, media_type, file_url) VALUES (?, ?, ?)',
        [entry.report_id, entry.media_type, entry.file_url]
      );
    }

    res.status(201).json({
      message: 'Media uploaded successfully',
      media: mediaEntries,
    });
  } catch (error) {
    console.error('UploadMedia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getReportMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const [media] = await pool.query('SELECT * FROM report_media WHERE report_id = ?', [id]);
    res.json({ media });
  } catch (error) {
    console.error('GetReportMedia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
