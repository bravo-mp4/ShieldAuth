using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace ShieldAuth
{
    /// <summary>Signed-answer checks; see sdk/PROTOCOL.md.</summary>
    public static class Protocol
    {
        public const string SignatureVersion = "shieldauth-v1";

        /// <summary>The text the server signs: fixed fields joined with "\n".</summary>
        public static string CanonicalMessage(string type, params object?[] fields)
        {
            var parts = new[] { SignatureVersion, type }.Concat(fields.Select(f => f?.ToString() ?? ""));
            return string.Join("\n", parts);
        }

        public static ECDsa ImportPublicKey(string pem)
        {
            var base64 = string.Concat(pem
                .Split('\n')
                .Select(line => line.Trim())
                .Where(line => line.Length > 0 && !line.StartsWith("-----", StringComparison.Ordinal)));
            var key = ECDsa.Create();
            key.ImportSubjectPublicKeyInfo(Convert.FromBase64String(base64), out _);
            return key;
        }

        /// <summary>Checks a base64 IEEE P1363 (r || s) ECDSA P-256 / SHA-256 signature.</summary>
        public static bool VerifySignature(ECDsa publicKey, string message, string signatureBase64)
        {
            try
            {
                var signature = Convert.FromBase64String(signatureBase64);
                // .NET's default signature format for ECDsa.VerifyData is IEEE P1363.
                return signature.Length == 64 &&
                       publicKey.VerifyData(Encoding.UTF8.GetBytes(message), signature, HashAlgorithmName.SHA256);
            }
            catch (FormatException)
            {
                return false;
            }
        }

        public static string NewNonce()
        {
            var bytes = new byte[18];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }
    }
}
