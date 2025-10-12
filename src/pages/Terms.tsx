import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';

const Terms: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <TopNav />
      
      <section style={{ 
        padding: '80px 0',
        background: 'var(--bg-primary)'
      }}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '32px',
                textAlign: 'center'
              }}>
                Terms & <span style={{ color: '#23AF91' }}>Conditions</span>
              </h1>
              
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                padding: '48px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                fontSize: '1rem'
              }}>
                <h2 style={{ color: 'var(--text-primary)', marginTop: '0', marginBottom: '16px' }}>Introduction</h2>
                <p>
                  Lomen Club and its associated services are established to support a community of holders of Lomen NFTs. 
                  Lomen Club is not the creator or minter of these NFTs and acts only as a community for their holders. 
                  The Lomen Club is an independent initiative not directly affiliated with KuCoin, which was responsible for creating Lomen NFTs.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using the associated services of Lomen Club, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>2. Intellectual Property Rights</h2>
                <p>
                  Unless specified otherwise, all content of Lomen Club on the website or social media platforms is the property of the Lomen Club.
                  The respective creators and holders own the Lomen NFTs. 
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>3. Team's Ownership of NFTs</h2>
                <p>
                  The Lomen Club's team, including its founder and any team members, may hold Lomen NFTs akin to other active club members. 
                  It is important to note that owning these NFTs does not confer any special privileges, rights, or benefits to the team beyond those available to any other active NFT holder within the club. 
                  The team is subject to the same rules, benefits, and responsibilities as all active club members, ensuring a fair and equitable community environment.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>4. Roadmap Disclaimer</h2>
                <p>
                  The roadmap presented by Lomen Club, including its founder, team, and affiliates on the Lomen Club website and other communication channels, is intended as a guideline for the club's future direction and is not a definitive forecast or promise. 
                  The Lome Club's ability to achieve the goals outlined in the roadmap is subject to various factors, including but not limited to market conditions, technological advancements, and regulatory changes. 
                  The roadmap should be viewed as an evolving document that may be adjusted in response to changing circumstances. 
                  The Lomen club does not guarantee the realization of any specific goals or timelines in the roadmap.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>5. Approval and Endorsement by KuCoin</h2>
                <p>
                  The Lomen Club was established following an application to KuCoin and subsequent approval by KuCoin to become a validator on their KuCoin Community Chain (KCC). 
                  In the application, the Lomen Club presented its plan and roadmap, which included using the name 'Lomen' in its community initiative 'Lomen Club'. 
                  The approval by KuCoin of the application, and by extension, their acceptance of the use of the 'Lomen' name in our community name 'Lomen Club', should be understood as acknowledgment and consent by KuCoin regarding our initiative. 
                  The approval is significant as it denotes KuCoin's recognition of our role within the KCC ecosystem and their acceptance of our use of the 'Lomen' name in 'Lomen Club', which originated from their creation.
                </p>
                <p>
                  While KuCoin has approved our application as a validator and the use of the 'Lomen' name, the Lomen Club operates independently. The Lomen Club's decisions, actions, and operations are not directed or controlled by KuCoin.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>6. Expenses and Rewards Distribution</h2>
                <p>
                  The Lomen Club incurs certain operational expenses, such as the hosting costs for the validator and other costs.
                  The Lomen Club's team, including the founder, reserves the right to deduct these hosting costs from the rewards generated by the validator or other club activities before distributing the remaining rewards to the community vault. 
                  Suppose the founder or the team chooses not to deduct these costs at any time. In that case, it does not establish an obligation or expectation to continue covering these expenses in the future. 
                  It is important to note that not deducting these costs is at the founder and team's discretion and is not an ongoing obligation. 
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>7. Classification of Lomen NFTs and Responsibility</h2>
                <p>
                  The Lomen Club acknowledges that the classification of NFTs, including Lomen NFTs, may evolve due to regulatory changes, particularly by bodies such as the U.S. Securities and Exchange Commission (SEC). It's important to clarify that the Lomen Club, including its founder and team members, did not mint or create the Lomen NFTs. 
                  KuCoin undertook the creation and issuance of these NFTs. Therefore, if Lomen NFTs are classified as securities or in any other specific manner by regulatory authorities in the future, the responsibility and any legal implications thereof would lie with the original creators, namely KuCoin, and not with the Lomen Club or its founder. 
                  The Lomen Club is a community platform for holders of these NFTs and is not responsible for their classification or compliance with related regulations.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>8. No Financial Advice, Disclaimers and Limitation of Liability</h2>
                <p>
                  The information and content provided by the Lomen Club, including its founder, team, and affiliates, whether on its website, social media platforms, or through any other channels, are for general informational purposes only. They should not be considered professional financial, investment, tax, or legal advice. 
                  The Lomen Club, including its founder, team, and affiliates, does not endorse or recommend specific investments or strategies. 
                  Users are advised to research or consult a qualified professional before making financial decisions.
                </p>
                <p>
                  The Lomen Club, including its founder, team, and affiliates, provides its services and information on an "as is" and "as available" basis. 
                  The Lomen Club, including its founder, team, and affiliates, makes no representations or warranties of any kind, express or implied, regarding the operation of its services or the information, content, materials, or products included. 
                  The Lomen Club, including its founder, team, and affiliates, does not warrant that the services will be uninterrupted, timely, secure, or error-free or that the quality of any products, services, information, or other material you obtain will meet your expectations.
                </p>
                <p>
                  To the fullest extent permitted by law, the Lomen Club, including its founder, team, and affiliates, shall not be liable for any indirect, incidental, special, consequential, or punitive damages or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to, use, or inability to access or use the services. 
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>9. Changes to Terms</h2>
                <p>
                  At its sole discretion, the Lomen Club reserves the right to modify or replace these terms at any time. If a revision is material, we will provide at least 30 days' notice before any new terms take effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our services after those revisions become effective, you agree to be bound by the revised terms. If you disagree with the new terms, you are no longer authorized to use the services.
                </p>
                <p>
                  These revised sections aim to provide a more comprehensive and protective framework for the Lomen Club and its users.
                </p>

                <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>10. Contact Information</h2>
                <p>
                  For any inquiries, please get in touch with info@lomenclub.com.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
