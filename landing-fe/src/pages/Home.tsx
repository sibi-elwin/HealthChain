import { motion } from 'framer-motion';
import { Shield, FileText, Users, Clock, Star, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Secure Medical Records',
    description: 'Your health data is encrypted and stored on the blockchain, ensuring maximum security and privacy.',
  },
  {
    icon: FileText,
    title: 'Easy Access',
    description: 'Access your medical records anytime, anywhere, with complete control over who can view them.',
  },
  {
    icon: Users,
    title: 'Doctor-Patient Collaboration',
    description: 'Seamless communication and data sharing between healthcare providers and patients.',
  },
];

const testimonials = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Cardiologist',
    content: 'HealthChain has revolutionized how I manage patient records. The platform is intuitive and secure.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Patient',
    content: 'I feel more in control of my health data than ever before. The platform is user-friendly and secure.',
    rating: 5,
  },
  {
    name: 'Dr. Robert Williams',
    role: 'General Practitioner',
    content: 'The efficiency gains from using HealthChain have been remarkable. Highly recommended.',
    rating: 5,
  },
];

const stats = [
  { label: 'Patients Served', value: '10,000+' },
  { label: 'Healthcare Providers', value: '500+' },
  { label: 'Years of Service', value: '3+' },
  { label: 'Satisfaction Rate', value: '98%' },
];

const Home = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="heading-1 text-gray-900 mb-6">
                Revolutionizing Healthcare with Blockchain Technology
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Secure, accessible, and efficient medical record management for patients and healthcare providers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="http://localhost:5174"
                  className="btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Access Patient Portal
                </a>
                <a
                  href="http://localhost:5173"
                  className="btn-outline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Access Doctor Portal
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/hero-image.png"
                  alt="Healthcare Technology"
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">Why Choose HealthChain?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with user-friendly design to transform healthcare management.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card group"
              >
                <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple and secure process for managing your healthcare data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {['Create Account', 'Upload Records', 'Share Securely', 'Access Anywhere'].map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="card text-center">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step}</h3>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="section bg-primary-600 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from patients and doctors who have experienced the benefits of HealthChain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-4">"{testimonial.content}"</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-primary-600">{testimonial.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="section bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="heading-2 mb-4">Ready to Transform Your Healthcare Experience?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join HealthChain today and take control of your medical records with confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="http://localhost:5174"
                className="btn-white-outline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Started as a Patient
              </a>
              <a
                href="http://localhost:5173"
                className="btn-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                Register as a Doctor
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home; 