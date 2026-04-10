export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4 text-5xl">⏳</div>
        
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Awaiting Approval</h1>
        
        <p className="text-gray-600 mb-4">
          Thank you for registering with TNVM! Your application is currently under review by our administrators.
        </p>
        
        <p className="text-gray-600 mb-6">
          You will receive an email notification once your account has been approved. This typically happens within 24-48 hours.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>What happens next?</strong> A TNVM administrator will review your registration and approve your account to access all member features.
          </p>
        </div>
        
        <a
          href="/login"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
