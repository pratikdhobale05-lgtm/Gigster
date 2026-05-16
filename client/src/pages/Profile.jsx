import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, User as UserIcon, Mail, Briefcase, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const Profile = () => {
  const { id } = useParams(); // The ID of the freelancer we are viewing
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      try {
        // In a real app, you'd have a route like /users/:id. 
        // For now, we will rely on the reviews route we just built!
        const reviewsResponse = await api.get(`/reviews/freelancer/${id}`);
        setReviews(reviewsResponse.data.data || []);
      } catch (err) {
        setError('Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndReviews();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* --- Profile Header --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <UserIcon className="w-12 h-12" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Freelancer Profile</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-600 text-sm">
            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4"/> Available for work</span>
            <span className="flex items-center gap-1 font-bold text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500"/> 
              {averageRating} ({reviews.length} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* --- Reviews Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Reviews</h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">This freelancer hasn't received any reviews yet.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{review.project?.title || 'Private Project'}</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic">"{review.comment}"</p>
                <p className="text-xs text-gray-400 mt-2">Reviewed by {review.reviewer?.name || 'A Client'} on {new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;