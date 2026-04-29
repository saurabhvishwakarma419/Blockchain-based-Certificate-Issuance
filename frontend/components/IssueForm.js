import React, { useState } from 'react';
import { generateHash } from '../utils/api';

const IssueForm = () => {
    const [formData, setFormData] = useState({ name: '', course: '', id: '' });
    const [resultHash, setResultHash] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = await generateHash(formData);
        if (data.certificate_hash) {
            setResultHash(data.certificate_hash);
            alert("Hash Generated! Now broadcast to Blockchain.");
        }
    };

    return (
        <div className="form-container">
            <h3>Issue New Certificate</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Student Name" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <input type="text" placeholder="Course Name" onChange={(e) => setFormData({...formData, course: e.target.value})} required />
                <input type="text" placeholder="Student ID" onChange={(e) => setFormData({...formData, id: e.target.value})} required />
                <button type="submit">Generate Secure Hash</button>
            </form>
            {resultHash && <p><strong>Generated Hash:</strong> {resultHash}</p>}
        </div>
    );
};

export default IssueForm;
