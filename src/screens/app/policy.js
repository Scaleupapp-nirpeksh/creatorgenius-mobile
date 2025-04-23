import React, { useState } from "react";
import {
  View,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Text } from "react-native-paper";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

const AcceptableUsePolicy = () => (
  <ScrollView style={styles.scene}>
    <Text variant="titleMedium" style={styles.title}>
      Acceptable Use Policy
    </Text>
    <Text variant="titleSmall" style={styles.text}>
      1. Introduction{"\n"}
      This Acceptable Use Policy ("AUP") outlines permitted and prohibited uses
      of the CreatorGenius service ("Service"). By using our Service, you agree
      to comply with this AUP. Violation of this AUP may result in suspension or
      termination of your access to the Service.{"\n\n"}
      2. Permitted Uses{"\n"}
      You may use the Service to: • Generate content ideas and scripts for your
      creative projects{"\n"}• Analyze trends and search for content inspiration
      {"\n"}• Plan and schedule your content calendar{"\n"}• Refine and improve
      your content concepts{"\n"}• Analyze content for SEO optimization{"\n"}•
      Save and organize your creative ideas{"\n"}• Collaborate with team members
      (on applicable subscription tiers){"\n\n"}
      3. Prohibited Uses{"\n"}
      3.1 Illegal Activities • Generate, store, or distribute content that
      violates any law{"\n"}• Promote illegal activities or infringe rights
      {"\n"}
      3.2 Harmful Content • Content promoting violence, hate speech,
      pornography, or false info{"\n"}
      3.3 System Abuse • Unauthorized access, disruption, bot usage, or reverse
      engineering{"\n"}
      3.4 API and System Usage • Exceed limits, manipulate systems, share
      credentials or resell access{"\n\n"}
      4. Content Guidelines 4.1 Content Ownership • You must own or have rights
      to all uploaded content{"\n"}• Review AI-generated content before public
      use{"\n"}
      4.2 Content Quality • Avoid generating low-quality/spam content or abusing
      limits{"\n\n"}
      5. Monitoring and Enforcement 5.1 Monitoring is optional; 5.2 Report
      violations to support@creatorgenius.com{"\n"}
      5.3 Actions: warning, suspension, termination, content removal{"\n"}
      5.4 Law enforcement reporting possible{"\n\n"}
      6. Changes to Policy • Changes effective immediately after posting online
      {"\n\n"}
      7. Contact Information • Email: support@creatorgenius.com
    </Text>
  </ScrollView>
);

const PrivacyPolicy = () => (
  <ScrollView variant="titleMedium" style={styles.scene}>
    <Text variant="titleMedium" style={styles.title}>
      Privacy Policy
    </Text>
    <Text variant="titleSmall" style={styles.text}>
      1. Introduction{"\n"}
      Effective Date: 16th April 2025{"\n"}
      This Privacy Policy describes how CreatorGenius collects, uses, and
      discloses your information when using the Service.{"\n\n"}
      2. Information We Collect{"\n"}
      2.1 Information You Provide (account info, profile, content data, payment,
      support messages){"\n"}
      2.2 Automatically Collected (usage, device, logs, location, cookies){"\n"}
      2.3 From Third Parties (social media, service providers, partners){"\n\n"}
      3. How We Use Your Info{"\n"}• Provide/improve service{"\n"}• Train AI,
      personalize content{"\n"}• Communicate updates and marketing{"\n"}• Legal
      and safety purposes{"\n\n"}
      4. Sharing Your Info{"\n"}• With service providers, AI partners, business
      transfers, legal authorities, and with your consent{"\n\n"}
      5. Data Retention: kept as needed for services/legal reasons{"\n"}
      6. Security: reasonable measures applied{"\n"}
      7. Your Rights: access, correct, delete, object, export data; email
      privacy@creatorgenius.com{"\n"}
      8. International Transfers to India and other countries{"\n"}
      9. No data collection from children under 18{"\n"}
      10. Policy Updates via notice/email{"\n"}
      11. Contact: admin@scaleupapp.club, Bengaluru
    </Text>
  </ScrollView>
);

const TermsOfService = () => (
  <ScrollView style={styles.scene}>
    <Text variant="titleMedium" style={styles.title}>
      Terms of Service
    </Text>
    <Text variant="titleSmall" style={styles.text}>
      1. Introduction and Acceptance{"\n"}
      Welcome to CreatorGenius. By using the Service, you accept these Terms.
      {"\n\n"}
      2. Service Description: AI tools for content creation, multiple
      subscription tiers{"\n"}
      3. Account Registration: accurate info, age 18+, secure credentials
      {"\n\n"}
      4. Subscriptions & Payments{"\n"}• Tiers: Free, Creator Pro, Agency Growth
      {"\n"}• Payment via Razorpay; auto-renewal unless cancelled{"\n"}• Refunds
      at discretion; 7-day window{"\n"}• Upgrade/downgrade available in settings
      {"\n\n"}
      5. Prohibited Activities: illegal content, impersonation, disruption,
      scraping, IP violations{"\n"}
      6. Intellectual Property: CreatorGenius owns all IP except user-generated
      content{"\n"}
      7. Privacy: governed by Privacy Policy; data used for AI training{"\n"}
      8. Termination: by user or platform; no refunds post-termination{"\n\n"}
      9. Disclaimer: Service is "as-is"{"\n"}
      10. Liability Limitation: max claim = 12-month fee amount{"\n"}
      11. Indemnification for misuse{"\n"}
      12. Modifications: Terms and service may change at any time{"\n"}
      13. Governing Law: India; arbitration in Bangalore{"\n\n"}
      Contact: admin@scaleupapp.club, Bengaluru
    </Text>
  </ScrollView>
);

export default function PoliciesScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "aup", title: "Acceptable Use" },
    { key: "privacy", title: "Privacy Policy" },
    { key: "terms", title: "Terms of Service" },
  ]);

  const renderScene = SceneMap({
    aup: AcceptableUsePolicy,
    privacy: PrivacyPolicy,
    terms: TermsOfService,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: "blue" }}
          style={{ backgroundColor: "black" }}
          labelStyle={{ color: "black" }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  text: {
    // fontSize: 12,
    // lineHeight: 22,
    marginBottom: 30,
  },
});
