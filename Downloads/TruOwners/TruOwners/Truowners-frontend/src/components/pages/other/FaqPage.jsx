// src/components/FAQ.jsx
import React, { useState } from 'react';
import './FaqPage.css';

const faqData = [
    {
        question: "What is Tru Owners?",
        answer: "Tru Owners is a property listing platform where owners can list and manage their properties directly without involving brokers. It’s designed to connect genuine buyers, sellers, and tenants."
    },
    {
        question: "Are all properties listed on Tru Owners verified?",
        answer: "Yes. We verify each property listing through documents, phone number validation, and activity checks to ensure authenticity."
    },
    {
        question: "Does Tru Owners charge a commission?",
        answer: "No, Tru Owners does not charge any commission on property deals. We only offer optional paid services for promotion or additional support."
    },
    {
        question: "How long will my listing stay live on the website?",
        answer: "A standard listing stays live for 90 days. You can renew or extend the listing at any time."
    },
    {
        question: "What types of properties can be listed on Tru Owners?",
        answer: "You can list residential, commercial, rental, and land properties on Tru Owners."
    },
    {
        question: "How do I contact a property owner?",
        answer: "Once you find a property, you can use the contact details provided in the listing or use our secure in-platform messaging to reach out directly to the owner."
    },

];

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return (


        <div className="faq-container1">

            {/* Section 1: Banner */}
            <section className="terms-banner">
                <h1>FAQ</h1>
            </section>


             <section className='faq-container'>
            <h2>Frequently Asked Questions</h2>
            {faqData.map((faq, index) => (
                <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFAQ(index)}>
                        {faq.question}
                        <span className="faq-icon">{activeIndex === index ? '-' : '+'}</span>
                    </div>
                    {activeIndex === index && <div className="faq-answer">{faq.answer}</div>}
                </div>
              
            ))}
            </section>
        </div>
    );
};

export default FAQ;
