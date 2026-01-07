namespace ShieldAuth.Models
{
    public class ValidateResponse
    {
        public bool Valid { get; set; }
        public string Message { get; set; }
        public long ExpiresAt { get; set; }
        public string SessionId { get; set; }
    }
}