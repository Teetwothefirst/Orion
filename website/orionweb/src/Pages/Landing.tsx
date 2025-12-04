import React, { useState } from 'react';
import { Menu, X, Shield, Zap, Video, CheckCircle, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">O</div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">OrionChat</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</a>
                    <a href="#services" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Services</a>
                    <a href="#download" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                        Download App
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden flex flex-col p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <a
                            href="#features"
                            className="flex items-center p-3 text-base font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a
                            href="#services"
                            className="flex items-center p-3 text-base font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Services
                        </a>
                        <a
                            href="#download"
                            className="flex items-center justify-center p-3 mt-2 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Download App
                        </a>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/50 via-transparent to-transparent"></div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        v2.0 is now live
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Connect with anyone,<br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">anywhere in the world.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Experience seamless, secure, and instant communication. Crystal clear voice, HD video, and encryption that actually works.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in text-white slide-in-from-bottom-10 duration-700 delay-300">
                        <a href="#download" className="group px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Get Started Free
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="#features" className="px-8 py-4 text-lg font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1">
                            Learn More
                        </a>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">Why Choose OrionChat?</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Built for speed, designed for privacy, and crafted for the best user experience.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="group p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">End-to-End Encryption</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Your conversations are private. We can't read your messages, and neither can anyone else. Security is our top priority.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform duration-300">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">Lightning Fast</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Optimized for low-latency delivery, ensuring your messages arrive the instant you send them, even on slow networks.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all duration-300">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                            <Video size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">Crystal Clear Voice</h3>
                        <p className="text-gray-600 leading-relaxed">
                            High-definition voice and video calls that make you feel like you're in the same room, powered by our global server network.
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold text-blue-400 bg-blue-900/30 rounded-full border border-blue-800">
                                FOR BUSINESS
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Enterprise Solutions for Modern Teams</h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Need more than just personal chat? OrionChat offers robust APIs, dedicated servers, and administrative controls for businesses of all sizes.
                            </p>

                            <ul className="space-y-5">
                                {[
                                    'Custom Integration Support',
                                    '99.99% Uptime SLA',
                                    'Dedicated Account Manager',
                                    'Advanced Security Controls'
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center text-gray-300">
                                        <CheckCircle className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm p-10 rounded-3xl border border-gray-700 shadow-2xl">
                            <h3 className="text-2xl font-bold mb-2">Contact Sales</h3>
                            <p className="text-gray-400 mb-8">Get a custom quote tailored to your organization's needs.</p>

                            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25">
                                Talk to an Expert
                            </button>
                            <p className="mt-4 text-center text-sm text-gray-500">No credit card required for demo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Download CTA Section */}
            <section id="download" className="py-32 px-6 text-center bg-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-gray-900 tracking-tight">Ready to start chatting?</h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        Download OrionChat for your preferred platform and sync your conversations across all devices instantly.
                    </p>

                    <div className="md:flex flex-row justify-center gap-6">
                        <div className="mb-3 group p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 max-w-sm mx-auto hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900">Mobile</h3>
                            <p className="text-gray-500 mb-8">iOS & Android</p>
                            <button className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 group-hover:shadow-lg">
                                <span>Download App</span>
                            </button>
                        </div>

                        <div className="group p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 max-w-sm mx-auto hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900">Desktop</h3>
                            <p className="text-gray-500 mb-8">macOS, Windows & Linux</p>
                            <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                                <span>Download Desktop</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 px-6 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center text-gray-600 font-bold text-xs">O</div>
                        <span className="font-bold text-gray-900">OrionChat</span>
                    </div>

                    <div className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} OrionChat Inc. All rights reserved.
                    </div>

                    <div className="flex space-x-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
