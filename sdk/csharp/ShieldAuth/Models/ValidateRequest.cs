namespace ShieldAuth.Models
{
    public class ValidateRequest
    {
        public string AppId { get; set; }
        public string LicenseKey { get; set; }
        public string HWID { get; set; }
    }
}