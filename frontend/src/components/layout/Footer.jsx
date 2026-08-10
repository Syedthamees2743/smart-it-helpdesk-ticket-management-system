const Footer = () => {
  return (
    <div className="bg-white text-center py-2 border-top text-muted" style={{height: '40px', fontSize: '0.8rem'}}>
      © {new Date().getFullYear()} Smart IT Service Desk. All Rights Reserved.
    </div>
  );
};

export default Footer;