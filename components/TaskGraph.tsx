import React, { useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';

// Mock data
const initialNodes = [
  { id: 'node1', title: 'Query User Database', content: 'SELECT * FROM users WHERE signup_date > YESTERDAY', status: 'pending', position: { top: '10%', left: '40%' } },
  { id: 'node2', title: 'Fetch API Data', content: 'GET /api/v1/user_activity', status: 'pending', position: { top: '40%', left: '10%' }, dependsOn: ['node1'] },
  { id: 'node3', title: 'Analyze Results', content: 'Aggregate user signups and activity', status: 'pending', position: { top: '40%', left: '70%' }, dependsOn: ['node1'] },
  { id: 'node4', title: 'Generate Report', content: 'Create a summary document', status: 'pending', position: { top: '75%', left: '40%' }, dependsOn: ['node2', 'node3'] },
];

const TaskGraph: React.FC = () => {
    const [nodes, setNodes] = useState(initialNodes);

    const handleApprove = (nodeId: string) => {
        setNodes(nodes.map(node => 
            node.id === nodeId ? { ...node, status: 'approved' } : node
        ));
    };
    
    return (
        <div className="relative w-full h-full bg-gray-900/30 border border-[#63bb33]/20 p-4 overflow-auto">
            <h3 className="text-center text-sm text-[#63bb33] mb-4">[ PROPOSED TASK PLAN ]</h3>
            <div className="relative h-full min-h-[500px]">
                {/* Lines would be drawn here in a more advanced implementation */}

                {nodes.map(node => (
                    <div 
                        key={node.id}
                        className="absolute p-3 bg-gray-900 border border-[#63bb33]/40 w-48 transition-all duration-300 shadow-lg shadow-black/50"
                        style={{ ...node.position, transform: 'translate(-50%, -50%)' }}
                    >
                        <p className="text-xs font-bold text-gray-200">{node.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono break-words">{node.content}</p>
                        <div className="mt-3">
                            {node.status === 'pending' ? (
                                <button onClick={() => handleApprove(node.id)} className="w-full text-xs bg-[#63bb33]/20 text-[#63bb33] hover:bg-[#63bb33]/40 py-1 transition-colors rounded">
                                    Approve
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-xs text-green-400 py-1 bg-green-500/10 rounded">
                                   <CheckIcon className="w-4 h-4" />
                                   <span>Approved</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskGraph;