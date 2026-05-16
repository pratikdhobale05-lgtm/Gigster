import { Calendar, DollarSign, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, userRole }) => {
    // Format the date nicely
    const deadline = new Date(project.deadline).toLocaleDateString();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Tag className="w-4 h-4" />
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                            {project.category}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center text-lg font-bold text-green-600 gap-1">
                        <DollarSign className="w-5 h-5" />
                        {project.budget}
                    </div>
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                {project.description}
            </p>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center text-sm text-gray-500 gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {deadline}</span>
                </div>

                {/* The button changes based on who is looking at the card! */}
                <Link to={`/project/${project._id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    {userRole === 'client' ? 'View Proposals' : 'Submit a Bid'}
                </Link>
            </div>
        </div>
    );
};

export default ProjectCard;