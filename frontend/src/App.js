import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:4000';

function App() {
  const [stores, setStores] = useState([]);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ratingValue, setRatingValue] = useState({});
  const [message, setMessage] = useState('');

  // Fetch stores after login
  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data);
    } catch (err) {
      setMessage('Failed to load stores.');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      setToken(res.data.token);
      setMessage('Login successful!');
      fetchStores();
    } catch (err) {
      setMessage('Login failed.');
    }
  };

  const rateStore = async (storeId) => {
    try {
      await axios.post(
        `${API_URL}/rate`,
        { storeId, value: ratingValue[storeId] || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Rating saved!');
      fetchStores();
    } catch {
      setMessage('Failed to save rating.');
    }
  };

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', marginBottom: 10, width: 300, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', marginBottom: 10, width: 300, padding: 8 }}
        />
        <button onClick={login} style={{ padding: '8px 16px' }}>
          Login
        </button>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Store Ratings</h2>
      {stores.length === 0 && <p>No stores available</p>}
      {stores.map((store) => (
        <div
          key={store.id}
          style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 }}
        >
          <h3>{store.name}</h3>
          <p>Address: {store.address}</p>
          <p>Average Rating: {store.avgRating.toFixed(2)}</p>
          <label>
            Your Rating:{' '}
            <select
              value={ratingValue[store.id] || ''}
              onChange={(e) =>
                setRatingValue({ ...ratingValue, [store.id]: Number(e.target.value) })
              }
            >
              <option value="">Select</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => rateStore(store.id)} style={{ marginLeft: 10 }}>
            Submit
          </button>
        </div>
      ))}
      <p>{message}</p>
    </div>
  );
}

export default App;
