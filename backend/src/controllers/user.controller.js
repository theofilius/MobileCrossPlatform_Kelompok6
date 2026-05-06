const pool = require('../config/db');

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    await pool.query(
      'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
      [latitude, longitude, req.userId]
    );

    res.json({ message: 'Location updated' });
  } catch (error) {
    console.error('UpdateLocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getNearbyVolunteers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Haversine formula for distance calculation (in km)
    const [volunteers] = await pool.query(
      `SELECT id, name, avatar_url, latitude, longitude,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
       FROM users
       WHERE is_volunteer = TRUE
         AND latitude IS NOT NULL
         AND longitude IS NOT NULL
       HAVING distance <= ?
       ORDER BY distance ASC
       LIMIT 20`,
      [latitude, longitude, latitude, radius]
    );

    res.json({ volunteers });
  } catch (error) {
    console.error('GetNearbyVolunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getResponderTracking = async (req, res) => {
  try {
    const { reportId } = req.params;

    const [responders] = await pool.query(
      `SELECT r.*, u.name AS responder_name, u.phone AS responder_phone, u.avatar_url
       FROM responders r
       JOIN users u ON r.user_id = u.id
       WHERE r.report_id = ?`,
      [reportId]
    );

    // Simulate movement for demo purposes
    const simulatedResponders = responders.map((r) => ({
      ...r,
      latitude: r.latitude ? parseFloat(r.latitude) + (Math.random() - 0.5) * 0.001 : null,
      longitude: r.longitude ? parseFloat(r.longitude) + (Math.random() - 0.5) * 0.001 : null,
    }));

    res.json({ responders: simulatedResponders });
  } catch (error) {
    console.error('GetResponderTracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, is_volunteer } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (is_volunteer !== undefined) { updates.push('is_volunteer = ?'); params.push(is_volunteer); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [users] = await pool.query(
      'SELECT id, name, email, phone, avatar_url, is_volunteer FROM users WHERE id = ?',
      [req.userId]
    );

    res.json({ message: 'Profile updated', user: users[0] });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
