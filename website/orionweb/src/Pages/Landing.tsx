import React, { useState } from 'react';
import { Menu, X, Shield, Zap, Video, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingProps {
    onLaunchChat: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLaunchChat }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--wa-bg-default)] font-sans text-[var(--wa-text-primary)] selection:bg-[#00a884]/20 selection:text-[var(--wa-text-primary)]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[var(--wa-sidebar)]/80 backdrop-blur-md shadow-sm transition-all duration-300 border-b border-[var(--wa-border)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00a884] rounded-lg flex items-center justify-center text-white font-bold text-xl">O</div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00a884] to-[#017561]">OrionChat</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="text-sm font-medium text-[var(--wa-text-secondary)] hover:text-[#00a884] transition-colors">Features</a>
                    <a href="#services" className="text-sm font-medium text-[var(--wa-text-secondary)] hover:text-[#00a884] transition-colors">Services</a>
                    <button
                        onClick={onLaunchChat}
                        className="text-sm font-medium text-[#00a884] hover:text-[#017561] transition-colors"
                    >
                        Web Chat
                    </button>
                    <a href="#download" className="px-5 py-2.5 text-sm font-medium text-white bg-[#00a884] rounded-full hover:bg-[#017561] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                        Download App
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-[var(--wa-text-secondary)] hover:text-[#00a884] transition-colors rounded-lg hover:bg-[var(--wa-hover)]"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-[var(--wa-sidebar)] border-b border-[var(--wa-border)] shadow-xl md:hidden flex flex-col p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <a
                            href="#features"
                            className="flex items-center p-3 text-base font-medium text-[var(--wa-text-primary)] rounded-xl hover:bg-[var(--wa-hover)] hover:text-[#00a884] transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a
                            href="#services"
                            className="flex items-center p-3 text-base font-medium text-[var(--wa-text-primary)] rounded-xl hover:bg-[var(--wa-hover)] hover:text-[#00a884] transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Services
                        </a>
                        <button
                            onClick={() => {
                                onLaunchChat();
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center p-3 text-base font-medium text-[#00a884] rounded-xl hover:bg-[var(--wa-hover)] transition-colors"
                        >
                            Web Chat
                        </button>
                        <a
                            href="#download"
                            className="flex items-center justify-center p-3 mt-2 text-base font-bold text-white bg-[#00a884] rounded-xl hover:bg-[#017561] transition-all shadow-sm"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Download App
                        </a>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00a884]/10 via-transparent to-transparent"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#128C7E]/10 via-transparent to-transparent"></div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-semibold text-[#00a884] bg-[#00a884]/10 rounded-full border border-[#00a884]/20 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#128C7E]"></span>
                        </span>
                        v2.0 is now live
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--wa-text-primary)] mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Connect with anyone,<br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a884] to-[#128C7E]">anywhere in the world.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl md:text-2xl text-[var(--wa-text-secondary)] mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Experience seamless, secure, and instant communication. Crystal clear voice, HD video, and encryption that actually works.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in text-white slide-in-from-bottom-10 duration-700 delay-300">
                        <button
                            onClick={onLaunchChat}
                            className="group px-8 py-4 text-lg font-bold text-white bg-[#00a884] rounded-xl hover:bg-[#017561] shadow-lg hover:shadow-[#00a884]/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            Launch Web Chat
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a href="#features" className="px-8 py-4 text-lg font-bold text-[var(--wa-text-primary)] bg-[var(--wa-sidebar)] border border-[var(--wa-border)] rounded-xl hover:bg-[var(--wa-hover)] shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1">
                            Learn More
                        </a>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--wa-text-primary)]">Why Choose OrionChat?</h2>
                    <p className="text-xl text-[var(--wa-text-secondary)] max-w-2xl mx-auto">Built for speed, designed for privacy, and crafted for the best user experience.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] hover:shadow-xl hover:border-[#00a884]/30 transition-all duration-300">
                        <div className="w-14 h-14 bg-[#00a884]/10 rounded-2xl flex items-center justify-center mb-6 text-[#00a884] group-hover:scale-110 transition-transform duration-300">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[var(--wa-text-primary)]">End-to-End Encryption</h3>
                        <p className="text-[var(--wa-text-secondary)] leading-relaxed">
                            Your conversations are private. We can't read your messages, and neither can anyone else. Security is our top priority.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] hover:shadow-xl hover:border-[#00a884]/30 transition-all duration-300">
                        <div className="w-14 h-14 bg-[#00a884]/10 rounded-2xl flex items-center justify-center mb-6 text-[#00a884] group-hover:scale-110 transition-transform duration-300">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[var(--wa-text-primary)]">Lightning Fast</h3>
                        <p className="text-[var(--wa-text-secondary)] leading-relaxed">
                            Optimized for low-latency delivery, ensuring your messages arrive the instant you send them, even on slow networks.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] hover:shadow-xl hover:border-[#00a884]/30 transition-all duration-300">
                        <div className="w-14 h-14 bg-[#00a884]/10 rounded-2xl flex items-center justify-center mb-6 text-[#00a884] group-hover:scale-110 transition-transform duration-300">
                            <Video size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[var(--wa-text-primary)]">Crystal Clear Voice</h3>
                        <p className="text-[var(--wa-text-secondary)] leading-relaxed">
                            High-definition voice and video calls that make you feel like you're in the same room, powered by our global server network.
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-[#111b21] text-[#e9edef] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00a884]/10 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold text-[#00a884] bg-[#00a884]/20 rounded-full border border-[#00a884]/30">
                                FOR BUSINESS
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">Enterprise Solutions for Modern Teams</h2>
                            <p className="text-[#8696a0] text-lg mb-8 leading-relaxed">
                                Need more than just personal chat? OrionChat offers robust APIs, dedicated servers, and administrative controls for businesses of all sizes.
                            </p>

                            <ul className="space-y-5">
                                {[
                                    'Custom Integration Support',
                                    '99.99% Uptime SLA',
                                    'Dedicated Account Manager',
                                    'Advanced Security Controls'
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center text-[#e9edef]">
                                        <CheckCircle className="w-6 h-6 text-[#00a884] mr-3 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#202c33]/80 backdrop-blur-sm p-10 rounded-3xl border border-[#222d34] shadow-2xl">
                            <h3 className="text-2xl font-bold mb-2 text-white">Contact Sales</h3>
                            <p className="text-[#8696a0] mb-8">Get a custom quote tailored to your organization's needs.</p>

                            <button className="w-full py-4 bg-[#00a884] hover:bg-[#017561] text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-[#00a884]/25">
                                Talk to an Expert
                            </button>
                            <p className="mt-4 text-center text-sm text-[#8696a0]">No credit card required for demo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Download CTA Section */}
            <section id="download" className="py-32 px-6 text-center bg-[var(--wa-bg-chat)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-[var(--wa-text-primary)] tracking-tight">Ready to start chatting?</h2>
                    <p className="text-xl text-[var(--wa-text-secondary)] mb-12 max-w-2xl mx-auto">
                        Download OrionChat for your preferred platform or use our web version to sync your conversations across all devices instantly.
                    </p>

                    <div className="md:flex flex-row justify-center gap-6">
                        <div className="group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] flex-1 max-w-sm mx-auto hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold mb-2 text-[var(--wa-text-primary)]">Web Version</h3>
                            <p className="text-[var(--wa-text-secondary)] mb-8">No installation required</p>
                            <button
                                onClick={onLaunchChat}
                                className="w-full py-3.5 bg-[#00a884] text-white rounded-xl font-bold hover:bg-[#017561] transition flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-[#00a884]/25"
                            >
                                <span>Launch Web Chat</span>
                            </button>
                        </div>

                        <div className="mb-3 group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] flex-1 max-w-sm mx-auto hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold mb-2 text-[var(--wa-text-primary)]">Mobile</h3>
                            <p className="text-[var(--wa-text-secondary)] mb-8">iOS & Android</p>
                            <button className="w-full py-3.5 bg-[var(--wa-text-primary)] text-[var(--wa-sidebar)] rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 group-hover:shadow-lg">
                                <span>Download App</span>
                            </button>
                        </div>

                        <div className="group p-8 bg-[var(--wa-sidebar)] rounded-3xl shadow-sm border border-[var(--wa-border)] flex-1 max-w-sm mx-auto hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold mb-2 text-[var(--wa-text-primary)]">Desktop</h3>
                            <p className="text-[var(--wa-text-secondary)] mb-8">macOS, Windows & Linux</p>
                            <button className="w-full py-3.5 bg-[var(--wa-bg-default)] text-[var(--wa-text-secondary)] rounded-xl font-bold hover:bg-[var(--wa-hover)] transition flex items-center justify-center gap-2">
                                <span>Coming Soon</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[var(--wa-sidebar)] py-12 px-6 border-t border-[var(--wa-border)]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[var(--wa-bg-default)] rounded-md flex items-center justify-center text-[var(--wa-text-secondary)] font-bold text-xs">O</div>
                        <span className="font-bold text-[var(--wa-text-primary)]">OrionChat</span>
                    </div>

                    <div className="text-[var(--wa-text-secondary)] text-sm">
                        © {new Date().getFullYear()} OrionChat Inc. All rights reserved.
                    </div>

                    <div className="flex space-x-8 text-sm font-medium text-[var(--wa-text-secondary)]">
                        <a href="#" className="hover:text-[#00a884] transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[#00a884] transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-[#00a884] transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
