import React from 'react';

const ReturnRefundPolicyPage = () => {
  const content = `No Returns and No Refund`;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Return and Refund Policy</h1>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    </div>
  );
};

export default ReturnRefundPolicyPage;


