import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/admin/all')
      .then(r => setBookings(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title text-gray-900">Customer Bookings</h1>
        <div className="badge-blue font-bold px-4 py-1.5">{bookings.length} Total</div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Route</th>
              <th>Date</th>
              <th>Seat</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-10">Loading...</td></tr> : 
             bookings.length === 0 ? <tr><td colSpan="6" className="text-center py-10">No bookings found</td></tr> :
             bookings.map(b => (
              <tr key={b._id}>
                <td>
                  <div className="font-bold text-gray-900">{b.user?.name}</div>
                  <div className="text-[10px] text-gray-500">{b.user?.email}</div>
                </td>
                <td>
                  <div className="font-semibold text-gray-900">{b.route?.name}</div>
                  <div className="text-[10px] text-gray-400">{b.departure_time}</div>
                </td>
                <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                <td><span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold text-gray-600">{b.seat_number}</span></td>
                <td className="font-bold text-primary">${b.price}</td>
                <td>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    b.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 
                    b.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
