import { motion } from 'framer-motion';
import { Shield, Users, Globe, Award } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'We prioritize the security and privacy of your medical data above all else.',
  },
  {
    icon: Users,
    title: 'User-Centric',
    description: 'Our platform is designed with both patients and healthcare providers in mind.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: "We're working to revolutionize healthcare data management worldwide.",
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for excellence in everything we do, from technology to customer service.',
  },
];

const team = [
  {
    name: 'Dr. Emily Chen',
    role: 'Chief Medical Officer',
    bio: 'Board-certified physician with 15 years of experience in healthcare technology.',
    image: '/team/emily.jpg',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Chief Technology Officer',
    bio: 'Blockchain expert with a background in healthcare systems architecture.',
    image: '/team/michael.jpg',
  },
  {
    name: 'Sarah Thompson',
    role: 'Head of Product',
    bio: 'Product leader with experience at leading healthcare technology companies.',
    image: '/team/sarah.jpg',
  },
  {
    name: 'David Kim',
    role: 'Security Director',
    bio: 'Cybersecurity specialist focused on healthcare data protection.',
    image: '/team/david.jpg',
  },
];

const About = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="heading-1 text-gray-900 mb-6">About HealthChain</h1>
            <p className="text-xl text-gray-600">
              We're on a mission to transform healthcare data management through blockchain technology,
              making it more secure, accessible, and efficient for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="heading-2 text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At HealthChain, we believe that healthcare data should be secure, accessible, and
                controlled by the people it belongs to. Our platform leverages blockchain technology
                to create a new standard in medical record management.
              </p>
              <p className="text-lg text-gray-600">
                We're committed to building a future where patients and healthcare providers can
                collaborate seamlessly while maintaining the highest standards of data security
                and privacy.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/about-mission.jpg"
                  alt="Healthcare Mission"
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at HealthChain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card text-center"
              >
                <value.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the experts behind HealthChain's innovative healthcare solutions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="aspect-w-1 aspect-h-1 rounded-full overflow-hidden mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <div className="text-primary-600 mb-2">{member.role}</div>
                <p className="text-gray-600">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gray-50">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="heading-2 text-gray-900 mb-4">Join Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Be part of the healthcare revolution. Together, we can create a more secure and
              efficient healthcare system for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="http://localhost:5174"
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join as Patient
              </a>
              <a
                href="http://localhost:5173"
                className="btn-outline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join as Doctor
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About; 