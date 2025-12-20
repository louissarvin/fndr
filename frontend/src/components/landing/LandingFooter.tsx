const LandingFooter = () => {
  return (
    <footer className="pt-12 px-8 relative overflow-hidden bg-[#000000]">
      <div className="max-w-5xl mx-auto relative">
        {/* Footer Card Container */}
        <div className="bg-[#A2D5C6]/10 backdrop-blur-md shadow-lg rounded-t-3xl p-10 relative overflow-hidden">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row md:items-start gap-12 mb-16 relative z-10">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img src="/fndr.png" alt="Fndr" className="h-24" />
            </div>

            {/* Links Columns */}
            <div className="flex gap-24">
              {/* Resources */}
              <div>
                <h4 className="text-[#FFFFFF] font-semibold mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors">GitHub</a></li>
                  <li><a href="#" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors">Support & Feedback</a></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-[#FFFFFF] font-semibold mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors">Telegram</a></li>
                  <li><a href="#" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors">X (Twitter)</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-[#FFFFFF]/40 text-sm relative z-10">© 2025 fndr.site</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
