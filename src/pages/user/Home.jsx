//import React from 'react';
import Slider from '../../components/user/Slider';
import Sidebar from '../../components/user/Sidebar';
import FeaturesItems from '../../components/user/FeaturesItems';
import CategoryTab from '../../components/user/CategoryTab';
import RecommendedItems from '../../components/user/RecommendedItems';

function Home() {
  return (
    <>
      <Slider />
      
      <section>
        <div className="container">
          <div className="row">
            <div className="col-sm-3">
              <Sidebar />
            </div>
            
            <div className="col-sm-9 padding-right">
              <FeaturesItems />
              <CategoryTab />
              <RecommendedItems />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
